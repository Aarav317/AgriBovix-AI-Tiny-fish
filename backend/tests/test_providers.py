import asyncio

import httpx
import pytest
from fastapi import HTTPException

from app.services import providers


class MockClient:
    def __init__(self, response):
        self.response = response

    async def __aenter__(self):
        return self

    async def __aexit__(self, *args):
        return None

    async def post(self, *args, **kwargs):
        return self.response


class MockTinyFishClient:
    def __init__(self):
        self.search_params = []
        self.fetch_payload = None

    async def __aenter__(self):
        return self

    async def __aexit__(self, *args):
        return None

    async def get(self, url, *, params, headers):
        self.search_params.append(params)
        return mock_response(
            200,
            {
                'results': [
                    {
                        'title': 'Official crop guidance',
                        'url': 'https://icar.org.in/crop-guidance',
                        'snippet': 'Visible symptoms and recommended field checks.',
                    },
                    {
                        'title': 'Unsafe result',
                        'url': 'javascript:alert(1)',
                        'snippet': 'Must not be exposed as a source.',
                    },
                    {
                        'title': 'Malformed web URL',
                        'url': 'https://icar.org.in:invalid/guidance',
                        'snippet': 'Must not be exposed as a source.',
                    },
                ]
            },
        )

    async def post(self, url, *, headers, json):
        self.fetch_payload = json
        return mock_response(
            200,
            {
                'results': [
                    {
                        'url': 'https://icar.org.in/crop-guidance',
                        'final_url': 'https://icar.org.in/crop-guidance',
                        'title': 'Official crop guidance',
                        'text': 'Retrieved page content about the observed crop symptoms.',
                    }
                ],
                'errors': [],
            },
        )


def mock_response(status_code, payload=None):
    response = httpx.Response(
        status_code,
        json=payload if payload is not None else {},
        request=httpx.Request('POST', 'https://generativelanguage.googleapis.com'),
    )
    return response


@pytest.fixture(autouse=True)
def clear_gemini_quota_cooldowns():
    with providers._gemini_quota_lock:
        providers._gemini_daily_quota_until.clear()
    yield
    with providers._gemini_quota_lock:
        providers._gemini_daily_quota_until.clear()


@pytest.mark.parametrize(
    'status_code, expected_code',
    [
        (401, 'gemini_access_denied'),
        (403, 'gemini_access_denied'),
        (404, 'gemini_model_not_found'),
        (429, 'gemini_rate_limited'),
        (503, 'gemini_unavailable'),
    ],
)
def test_gemini_http_errors_are_actionable(monkeypatch, status_code, expected_code):
    monkeypatch.setenv('GEMINI_API_KEY', 'test-only-key')
    if status_code == 429:
        async def no_wait(_):
            return None

        monkeypatch.setattr(providers.asyncio, 'sleep', no_wait)
    monkeypatch.setattr(
        providers.httpx,
        'AsyncClient',
        lambda **kwargs: MockClient(mock_response(status_code)),
    )

    with pytest.raises(HTTPException) as error:
        asyncio.run(providers.gemini_generate([{'text': 'test'}]))

    assert error.value.status_code == (429 if status_code == 429 else 502)
    assert error.value.detail['code'] == expected_code
    assert 'test-only-key' not in error.value.detail['message']


def test_gemini_daily_quota_is_not_retried_and_is_cooled_down(monkeypatch):
    monkeypatch.setenv('GEMINI_API_KEY', 'test-only-key')
    monkeypatch.setenv('GEMINI_MODEL', 'gemini-3-flash-preview')
    calls = []

    class CountingClient(MockClient):
        async def post(self, *args, **kwargs):
            calls.append(1)
            return self.response

    response = mock_response(
        429,
        {
            'error': {
                'message': (
                    'Quota exceeded for metric; limit: 20. Generate content '
                    'requests per day limit exceeded on Free Tier. Please retry '
                    'in 3h28m57.9s.'
                )
            }
        },
    )
    monkeypatch.setattr(
        providers.httpx,
        'AsyncClient',
        lambda **kwargs: CountingClient(response),
    )

    messages = []
    for _ in range(2):
        with pytest.raises(HTTPException) as error:
            asyncio.run(providers.gemini_generate([{'text': 'test'}]))
        assert error.value.status_code == 429
        assert error.value.detail['code'] == 'gemini_daily_quota_exhausted'
        messages.append(error.value.detail['message'])

    assert len(calls) == 1
    assert '20 requests/day' in messages[0]
    assert '3 hours 29 minutes' in messages[0]
    assert 'Google AI Studio' in messages[0]
    assert 'test-only-key' not in messages[0]


def test_gemini_temporary_rate_limit_retries_with_backoff(monkeypatch):
    monkeypatch.setenv('GEMINI_API_KEY', 'test-only-key')
    responses = [
        mock_response(
            429,
            {'error': {'message': 'Requests per minute limit exceeded.'}},
        ),
        mock_response(
            200,
            {'candidates': [{'content': {'parts': [{'text': 'OK'}]}}]},
        ),
    ]
    delays = []

    class SequenceClient:
        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            return None

        async def post(self, *args, **kwargs):
            response = responses.pop(0)
            response.request = httpx.Request(
                'POST', 'https://generativelanguage.googleapis.com'
            )
            return response

    async def record_wait(delay):
        delays.append(delay)

    monkeypatch.setattr(providers.asyncio, 'sleep', record_wait)
    monkeypatch.setattr(
        providers.httpx,
        'AsyncClient',
        lambda **kwargs: SequenceClient(),
    )

    result = asyncio.run(
        providers.gemini_generate([{'text': 'test'}], json_mode=False)
    )

    assert result == 'OK'
    assert not responses
    assert delays == [0.5]


def test_gemini_rate_limit_retries_are_bounded(monkeypatch):
    monkeypatch.setenv('GEMINI_API_KEY', 'test-only-key')
    calls = []
    delays = []

    class CountingClient(MockClient):
        async def post(self, *args, **kwargs):
            calls.append(1)
            return self.response

    async def record_wait(delay):
        delays.append(delay)

    monkeypatch.setattr(providers.asyncio, 'sleep', record_wait)
    monkeypatch.setattr(
        providers.httpx,
        'AsyncClient',
        lambda **kwargs: CountingClient(mock_response(429)),
    )

    with pytest.raises(HTTPException) as error:
        asyncio.run(providers.gemini_generate([{'text': 'test'}]))

    assert error.value.status_code == 429
    assert error.value.detail['code'] == 'gemini_rate_limited'
    assert len(calls) == providers.GEMINI_MAX_RETRIES + 1
    assert delays == [0.5, 1.0]


def test_gemini_missing_candidate_returns_clear_error(monkeypatch):
    monkeypatch.setenv('GEMINI_API_KEY', 'test-only-key')
    monkeypatch.setattr(
        providers.httpx,
        'AsyncClient',
        lambda **kwargs: MockClient(mock_response(200, {'candidates': []})),
    )

    with pytest.raises(HTTPException) as error:
        asyncio.run(providers.gemini_generate([{'text': 'test'}]))

    assert error.value.detail['code'] == 'gemini_empty_response'


def test_gemini_invalid_analysis_format_returns_clear_error(monkeypatch):
    monkeypatch.setenv('GEMINI_API_KEY', 'test-only-key')
    monkeypatch.setattr(
        providers.httpx,
        'AsyncClient',
        lambda **kwargs: MockClient(
            mock_response(
                200,
                {'candidates': [{'content': {'parts': [{'text': 'not json'}]}}]},
            )
        ),
    )

    with pytest.raises(HTTPException) as error:
        asyncio.run(providers.gemini_generate([{'text': 'test'}]))

    assert error.value.detail['code'] == 'gemini_invalid_analysis'


@pytest.mark.parametrize(
    'text',
    [
        '{"subject":"crop"}',
        '```json\n{"subject":"crop"}\n```',
        'Here is the requested result:\n{"subject":"crop"}\nAnalysis complete.',
    ],
)
def test_gemini_json_parser_accepts_common_response_wrappers(text):
    assert providers._parse_gemini_json(text) == {'subject': 'crop'}


def test_gemini_json_parser_rejects_malformed_or_non_object_responses():
    assert providers._parse_gemini_json('{"subject":') is None
    assert providers._parse_gemini_json('["not", "an", "object"]') is None


def test_gemini_joins_text_parts_and_reports_truncated_responses(monkeypatch):
    monkeypatch.setenv('GEMINI_API_KEY', 'test-only-key')
    monkeypatch.setattr(
        providers.httpx,
        'AsyncClient',
        lambda **kwargs: MockClient(
            mock_response(
                200,
                {
                    'candidates': [
                        {
                            'finishReason': 'STOP',
                            'content': {
                                'parts': [
                                    {'thought': True, 'text': 'reasoning is not JSON'},
                                    {'text': '```json\n{"subject":'},
                                    {'text': '"crop"}\n```'},
                                ]
                            },
                        }
                    ]
                },
            )
        ),
    )

    result = asyncio.run(providers.gemini_generate([{'text': 'test'}]))

    assert result == {'subject': 'crop'}


def test_gemini_max_token_finish_is_reported_as_incomplete(monkeypatch):
    monkeypatch.setenv('GEMINI_API_KEY', 'test-only-key')
    monkeypatch.setattr(
        providers.httpx,
        'AsyncClient',
        lambda **kwargs: MockClient(
            mock_response(
                200,
                {
                    'candidates': [
                        {
                            'finishReason': 'MAX_TOKENS',
                            'content': {'parts': [{'text': '{"subject":'}]},
                        }
                    ]
                },
            )
        ),
    )

    with pytest.raises(HTTPException) as error:
        asyncio.run(providers.gemini_generate([{'text': 'test'}]))

    assert error.value.detail['code'] == 'gemini_incomplete_response'


def test_tinyfish_search_and_fetch_use_documented_shapes(monkeypatch):
    client = MockTinyFishClient()
    monkeypatch.setattr(providers, 'tinyfish_key', lambda: 'test-only-key')
    monkeypatch.setattr(providers.httpx, 'AsyncClient', lambda **kwargs: client)

    sources, status, message = asyncio.run(
        providers._tinyfish_research(
            'tomato leaf spots symptoms management',
            official_query='tomato leaf spots official crop guidance India',
        )
    )

    assert status == 'complete'
    assert message == 'TinyFish search and page retrieval completed.'
    assert len(client.search_params) == 2
    assert client.search_params[0]['location'] == 'IN'
    assert client.search_params[1]['include_domains'] == providers.TINYFISH_RESEARCH_DOMAINS['agrivision']
    assert client.fetch_payload['urls'] == ['https://icar.org.in/crop-guidance']
    assert client.fetch_payload['format'] == 'markdown'
    assert sources == [
        {
            'title': 'Official crop guidance',
            'url': 'https://icar.org.in/crop-guidance',
            'snippet': 'Visible symptoms and recommended field checks.',
            'content': 'Retrieved page content about the observed crop symptoms.',
            'retrieved': True,
        }
    ]


def test_tinyfish_failure_does_not_invent_sources(monkeypatch):
    class FailedSearchClient:
        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            return None

        async def get(self, *args, **kwargs):
            raise httpx.TimeoutException('test timeout')

    monkeypatch.setattr(providers, 'tinyfish_key', lambda: 'test-only-key')
    monkeypatch.setattr(providers.httpx, 'AsyncClient', lambda **kwargs: FailedSearchClient())

    sources, status, message = asyncio.run(
        providers._tinyfish_research('crop symptoms')
    )

    assert sources == []
    assert status == 'unavailable'
    assert message == 'TinyFish search timed out.'


def test_image_analysis_survives_missing_tinyfish_key(monkeypatch):
    from app.models.schemas import Analysis

    prediction = {
        'subject': 'Tomato plant',
        'possible_condition': 'Possible leaf spot',
        'model_name': 'Test Gemini',
        'confidence': None,
        'observations': ['Several dark spots are visible on the leaves.'],
        'care_steps': ['Have the plant assessed by an agricultural expert.'],
        'prevention': [],
        'treatment_options': [],
        'limitations': ['A photograph cannot confirm the cause.'],
        'urgency': 'expert_review',
        'sources': [],
    }

    async def fake_generate(*args, **kwargs):
        return prediction

    monkeypatch.setattr(providers, 'gemini_config', lambda: ('test-only-key', 'gemini-test'))
    monkeypatch.setattr(providers, 'gemini_generate', fake_generate)
    monkeypatch.setattr(providers, 'tinyfish_key', lambda: '')

    result = asyncio.run(providers.analyze('agrivision', b'test image', 'general'))

    validated = Analysis.model_validate(result)
    assert validated.subject == 'Tomato plant'
    assert validated.research_status == 'unavailable'
    assert 'TINYFISH_API_KEY' in validated.research_message
    assert validated.sources == []

def test_gemini_analysis_prompt_uses_selected_language(monkeypatch):
    from app.models.schemas import Analysis

    prediction = {
        'subject': 'ಬೆಳೆ',
        'possible_condition': None,
        'model_name': 'Test Gemini',
        'confidence': None,
        'observations': ['ಎಲೆ ಹಸಿರಾಗಿದೆ.'],
        'care_steps': [],
        'prevention': [],
        'treatment_options': [],
        'limitations': ['ಚಿತ್ರದಿಂದ ಮಾತ್ರ ದೃಢೀಕರಿಸಲಾಗದು.'],
        'urgency': 'expert_review',
        'sources': [],
    }
    prompts=[]

    async def fake_generate(parts, **kwargs):
        prompts.append(parts[0]['text'])
        return prediction

    monkeypatch.setattr(providers, 'gemini_config', lambda: ('test-only-key', 'gemini-test'))
    monkeypatch.setattr(providers, 'gemini_generate', fake_generate)
    monkeypatch.setattr(providers, 'tinyfish_key', lambda: '')

    result = asyncio.run(
        providers.analyze('agrivision', b'test image', 'general', 'kn')
    )

    Analysis.model_validate(result)
    assert 'Kannada (Kannada script)' in prompts[0]
    assert 'JSON property names and urgency values exactly as specified in English' in prompts[0]
