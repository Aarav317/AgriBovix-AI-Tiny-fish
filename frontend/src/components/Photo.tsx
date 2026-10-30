import { useState } from "react";
export function Photo({
  src,
  alt,
  className = "",
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <img
      className={className}
      src={failed ? "/images/fallback.svg" : src}
      alt={alt}
      onError={() => setFailed(true)}
    />
  );
}
