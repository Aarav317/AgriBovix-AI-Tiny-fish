import type { SVGProps } from "react";
export function CowIcon({
  size = 24,
  strokeWidth = 1.7,
  ...props
}: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M7.5 7 6 3M16.5 7 18 3M7 7C5 5 2 6 2 8c1 2 3 2 5 1M17 7c2-2 5-1 5 1-1 2-3 2-5 1M7 7c1-2 9-2 10 0l-1 10c0 3-8 3-8 0Z" />
      <path d="M8 15c2-2 6-2 8 0M10 17h.01M14 17h.01M9 10h.01M15 10h.01" />
    </svg>
  );
}
