import { Link } from "react-router-dom";
export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      to="/"
      className={`brand ${compact ? "compact" : ""}`}
      aria-label="AgriBovix AI home"
    >
      <span className="brand-art">
        <img src="/logo/agribovix-original.png" alt="Original AgriBovix logo" />
      </span>
      <span>
        AgriBovix <span className="brand-ai">AI</span>
      </span>
    </Link>
  );
}
