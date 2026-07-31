import { ReactNode } from "react";

interface DashboardContentProps {
  children: ReactNode;
}

export function DashboardContent({
  children,
}: DashboardContentProps) {
  return (
    <main className="flex-1 bg-slate-50 p-6">
      {children}
    </main>
  );
}