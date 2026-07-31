import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  LayoutDashboard,
  PawPrint,
  Settings,
} from "lucide-react";

export interface NavigationItem {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
}

export const navigation: NavigationItem[] = [
  {
    title: "Dashboard",
    description: "Resumen general de la clínica.",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Citas",
    description: "Visualiza y administra las citas programadas.",
    href: "/citas",
    icon: CalendarDays,
  },
  {
    title: "Servicios",
    description: "Administra los servicios disponibles para reservación.",
    href: "/servicios",
    icon: PawPrint,
  },
  {
    title: "Configuración",
    description: "Personaliza la configuración de la aplicación.",
    href: "/configuracion",
    icon: Settings,
  },
];