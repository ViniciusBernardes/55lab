export const appNavItems = [
  {
    type: "link",
    label: "Dashboard",
    to: "/app",
    icon: "fa-th-large",
    end: true,
  },
  {
    type: "section",
    label: "Módulos",
  },
  {
    type: "link",
    label: "Editais",
    to: "/app/editais",
    icon: "fa-file-text-o",
  },
  {
    type: "link",
    label: "Helpdesk",
    to: "/app/tickets",
    icon: "fa-life-ring",
  },
  {
    type: "link",
    label: "Integrações",
    to: "/app/tickets/integracoes",
    icon: "fa-plug",
  },
  {
    type: "link",
    label: "OpenAI",
    to: "/app/editais/credenciais",
    icon: "fa-key",
  },
];
