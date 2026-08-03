"use client";

import { Sheet, SheetContent } from "@/components/ui/sheet";

interface AppSidebarProps {
  mobile?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function SidebarNav() {
  return (
    <nav className="flex flex-col gap-1 p-4">
      {/* your existing nav links go here */}
    </nav>
  );
}

export function AppSidebar({ mobile, open, onOpenChange }: AppSidebarProps) {
  if (mobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="left" className="w-64 p-0">
          <SidebarNav />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <aside className="w-64 shrink-0 border-r border-border bg-card">
      <SidebarNav />
    </aside>
  );
}