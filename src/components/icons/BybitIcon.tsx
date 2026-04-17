import type { SVGProps } from "react";

/**
 * Bybit exchange logo placeholder.
 * Magic MCP did not return Bybit on first lookup. This is a simple wordmark fallback.
 * TODO: replace with official Bybit brand asset when approved.
 */
export const BybitIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    width="96"
    height="32"
    viewBox="0 0 96 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Bybit"
    role="img"
    {...props}
  >
    <rect width="96" height="32" rx="6" fill="#F7A600" />
    <text
      x="48"
      y="21"
      fill="#17181F"
      fontFamily="Inter, sans-serif"
      fontSize="16"
      fontWeight="700"
      textAnchor="middle"
    >
      Bybit
    </text>
  </svg>
);
