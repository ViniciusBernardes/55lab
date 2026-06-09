import React from "react";

const icons = {
  view: (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"
      />
      <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  delete: (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 6h18M8 6V4h8v2m-1 0v14H9V6"
      />
    </svg>
  ),
};

export function AppActionButton({
  as: Component = "button",
  variant = "view",
  children,
  className = "",
  ...props
}) {
  return (
    <Component
      className={`lab-app-action-btn lab-app-action-btn--${variant} ${className}`.trim()}
      {...props}
    >
      {icons[variant]}
      {children ? <span>{children}</span> : null}
    </Component>
  );
}
