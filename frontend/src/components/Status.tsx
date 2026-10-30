import { AlertCircle, LoaderCircle } from "lucide-react";
export function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="error-message" role="alert">
      <AlertCircle size={19} />
      <span>{message}</span>
    </div>
  );
}
export function Loading({ text = "Loading…" }: { text?: string }) {
  return (
    <div className="loading" role="status">
      <LoaderCircle className="spin" size={21} />
      {text}
    </div>
  );
}
