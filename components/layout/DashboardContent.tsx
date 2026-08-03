import { ReactNode } from "react";

interface DashboardContentProps {
  children: ReactNode;
}

export function DashboardContent({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-w-0 flex-1 overflow-x-auto p-4 sm:p-6">
      {children}
    </main>
  );
}