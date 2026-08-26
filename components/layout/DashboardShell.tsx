"use client";

import { ReactNode, useState } from "react";

import { AppHeader } from "./AppHeader";
import { AppSidebar } from "./AppSidebar";
import { DashboardContent } from "./DashboardContent";

interface DashboardShellProps {
  children: ReactNode;
}

export function DashboardShell({
  children,
}: DashboardShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <AppSidebar />

      <AppSidebar
        mobile
        open={mobileMenuOpen}
        onOpenChange={setMobileMenuOpen}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader
          onMenuClick={() => setMobileMenuOpen(true)}
        />

        <DashboardContent>
          {children}
        </DashboardContent>
      </div>
    </div>
  );
}