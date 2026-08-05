import React from "react";

/** Lightweight module illustrations for dashboard cards */
export function ModuleIllustration({ module }) {
  const common = {
    width: 56,
    height: 56,
    viewBox: "0 0 56 56",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    "aria-hidden": true,
  };

  if (module === "helpdesk") {
    return (
      <svg {...common}>
        <rect width="56" height="56" rx="14" fill="#CCFBF1" />
        <path
          d="M18 24c0-5.523 4.477-10 10-10s10 4.477 10 10v6c0 1.105-.895 2-2 2h-2v-8a6 6 0 10-12 0v8h-2c-1.105 0-2-.895-2-2v-6z"
          fill="#0F766E"
        />
        <path
          d="M16 32h4v4c0 1.105-.895 2-2 2h0c-1.105 0-2-.895-2-2v-4zM36 32h4v4c0 1.105-.895 2-2 2h0c-1.105 0-2-.895-2-2v-4z"
          fill="#14B8A6"
        />
        <path
          d="M24 40h8c0 2.209-1.791 3-4 3s-4-.791-4-3z"
          fill="#0D9488"
        />
      </svg>
    );
  }

  if (module === "assinatura") {
    return (
      <svg {...common}>
        <rect width="56" height="56" rx="14" fill="#E0E7FF" />
        <rect x="14" y="12" width="22" height="28" rx="3" fill="#fff" stroke="#4338CA" strokeWidth="1.75" />
        <path d="M18 20h14M18 25h14M18 30h9" stroke="#A5B4FC" strokeWidth="1.75" strokeLinecap="round" />
        <path
          d="M30 34l10-10 3.5 3.5-10 10H30v-3.5z"
          fill="#4F46E5"
        />
        <circle cx="40" cy="16" r="7" fill="#6366F1" />
        <path
          d="M37.5 16.2l1.6 1.6 3.4-3.4"
          stroke="#fff"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  // editais (default)
  return (
    <svg {...common}>
      <rect width="56" height="56" rx="14" fill="#E0F2FE" />
      <rect x="13" y="11" width="24" height="30" rx="3" fill="#fff" stroke="#0284C7" strokeWidth="1.75" />
      <path d="M18 19h14M18 24h14M18 29h9" stroke="#7DD3FC" strokeWidth="1.75" strokeLinecap="round" />
      <rect x="28" y="30" width="16" height="14" rx="2.5" fill="#0EA5E9" />
      <path
        d="M32 37h8M32 40.5h5"
        stroke="#fff"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="40.5" cy="34" r="1.4" fill="#fff" />
    </svg>
  );
}
