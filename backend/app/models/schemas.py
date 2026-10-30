import re
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field, HttpUrl, field_validator

class RegisterInput(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: str = Field(max_length=254)
    password: str = Field(min_length=10, max_length=128)

    @field_validator('name')
    @classmethod
    def clean_name(cls, value):
        if len(value.strip()) < 2:
            raise ValueError('Please enter your name.')
        return value.strip()

    @field_validator('email')
    @classmethod
    def email_format(cls, value):
        value = value.strip().lower()
        if not re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+', value):
            raise ValueError('Enter a valid email address.')
        return value

class LoginInput(BaseModel):
    email: str = Field(min_length=3, max_length=254)
    password: str = Field(min_length=1, max_length=128)

class Source(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    url: HttpUrl
    snippet: str | None = Field(default=None, max_length=1000)
    content: str | None = Field(default=None, max_length=3000)
    retrieved: bool = False

class Analysis(BaseModel):
    model_config = ConfigDict(extra='forbid')
    subject: str = Field(min_length=1, max_length=200)
    possible_condition: str | None = Field(default=None, max_length=300)
    model_name: str = Field(min_length=1, max_length=200)
    confidence: float | None = Field(default=None, ge=0, le=1)
    observations: list[str] = Field(min_length=1, max_length=12)
    care_steps: list[str] = Field(default_factory=list, max_length=12)
    prevention: list[str] = Field(default_factory=list, max_length=12)
    treatment_options: list[str] = Field(default_factory=list, max_length=8)
    limitations: list[str] = Field(min_length=1, max_length=12)
    urgency: Literal['routine', 'expert_review', 'urgent'] = 'expert_review'
    sources: list[Source] = Field(default_factory=list, max_length=8)
    research_status: Literal['complete', 'partial', 'no_results', 'unavailable'] = 'unavailable'
    research_message: str | None = Field(default=None, max_length=500)
    research_queries: list[str] = Field(default_factory=list, max_length=2)

    @field_validator('observations','care_steps','prevention','treatment_options','limitations')
    @classmethod
    def bounded_text(cls, values):
        if any(not v.strip() or len(v) > 1500 for v in values):
            raise ValueError('Invalid guidance text.')
        return values

class ChatMessage(BaseModel):
    role: Literal['user', 'assistant']
    content: str = Field(min_length=1, max_length=2000)

class AssistantInput(BaseModel):
    messages: list[ChatMessage] = Field(min_length=1, max_length=20)
    language: Literal['en', 'hi', 'kn'] = 'en'

    @field_validator('language', mode='before')
    @classmethod
    def supported_language(cls, value):
        if isinstance(value, str) and value in {'en', 'hi', 'kn'}:
            return value
        return 'en'

class AssistantOutput(BaseModel):
    message: str = Field(min_length=1, max_length=6000)
    sources: list[Source] = Field(default_factory=list, max_length=8)
