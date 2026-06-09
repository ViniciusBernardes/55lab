import React from "react";
import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";

export function AppLayout() {
  return (
    <div className="lab-app">
      <AppSidebar />
      <div className="lab-app-shell">
        <main className="lab-app-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
