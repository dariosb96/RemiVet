"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  LayoutDashboard,
  Settings,
  Stethoscope,
  Users,
} from "lucide-react";

import { Sheet, SheetContent } from "@/components/ui/sheet";

interface AppSidebarProps {
  mobile?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const navigation = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Citas",
    href: "/citas",
    icon: CalendarDays,
  },
  {
    label: "Servicios",
    href: "/servicios",
    icon: Stethoscope,
  },
  {
    label: "Configuración",
    href: "/configuracion",
    icon: Settings,
  },
];

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 p-4">
      <div className="mb-4 px-3">
        <p className="text-lg font-bold">🐾 RemiVet</p>
        <p className="text-xs text-muted-foreground">
          Panel administrativo
        </p>
      </div>

      {navigation.map((item) => {
        const Icon = item.icon;

        const isActive =
          pathname === item.href ||
          pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={[
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            ].join(" ")}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}

      <div className="my-3 border-t" />

      <Link
        href="/configuracion/usuarios"
        onClick={onNavigate}
        className={[
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          pathname.startsWith("/configuracion/usuarios")
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
        ].join(" ")}
      >
        <Users className="h-4 w-4" />
        Usuarios
      </Link>
    </nav>
  );
}

export function AppSidebar({
  mobile,
  open,
  onOpenChange,
}: AppSidebarProps) {
  if (mobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="left" className="w-64 p-0">
          <SidebarNav onNavigate={() => onOpenChange?.(false)} />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <aside className="hidden w-64 shrink-0 border-r border-border bg-card md:block">
      <SidebarNav />
    </aside>
  );
}