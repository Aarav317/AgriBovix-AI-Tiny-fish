export type Workspace = "agrivision" | "pashuvision";
export type User = { id: string; name: string; email: string };
export type Source = {
  title: string;
  url: string;
  snippet?: string | null;
  content?: string | null;
  retrieved?: boolean;
};
export type Analysis = {
  subject: string;
  possible_condition: string | null;
  model_name: string;
  confidence: number | null;
  observations: string[];
  care_steps: string[];
  prevention: string[];
  treatment_options: string[];
  limitations: string[];
  urgency: "routine" | "expert_review" | "urgent";
  sources: Source[];
  research_status?: "complete" | "partial" | "no_results" | "unavailable";
  research_message?: string | null;
  research_queries?: string[];
};
export type Report = {
  id: string;
  workspace: Workspace;
  filename: string;
  created_at: string;
  result: Analysis;
};
export type Message = {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
};
export type Health = {
  status: string;
  workspaces: Record<
    Workspace,
    { analysis_configured: boolean; assistant_configured: boolean }
  >;
};
