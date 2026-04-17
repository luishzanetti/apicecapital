import type { SVGProps } from "react";

/**
 * Kraken exchange logo. Source: Magic MCP logo_search (21st.dev).
 * Simplified to hexagonal mark + wordmark. If the detailed octopus mark is needed,
 * request the full SVG via the Magic MCP component again.
 */
export const KrakenIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 256 274"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Kraken"
    role="img"
    {...props}
  >
    <path d="M128 1.3 0 64v148.1L128 275l128-62.8V64.1L128 1.3Z" fill="#5741D9" />
    <text
      x="128"
      y="155"
      fill="#ffffff"
      fontFamily="Inter, sans-serif"
      fontSize="56"
      fontWeight="700"
      textAnchor="middle"
      dominantBaseline="middle"
    >
      K
    </text>
  </svg>
);
