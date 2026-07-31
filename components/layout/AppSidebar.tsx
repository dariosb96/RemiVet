import Link from "next/link";

import { ROUTES } from "@/constants/routes";

const navigation = [
  {
    label: "Dashboard",
    href: ROUTES.DASHBOARD,
  },
  {
    label: "Citas",
    href: ROUTES.APPOINTMENTS,
  },
  {
    label: "Servicios",
    href: ROUTES.SERVICES,
  },
  {
    label: "Configuración",
    href: ROUTES.SETTINGS,
  },
];

export function AppSidebar() {
  return (
    <aside className="w-64 border-r bg-white">
      <div className="border-b p-6">
        <h2 className="text-xl font-bold">
          RemiVet
        </h2>
      </div>

      <nav className="flex flex-col gap-1 p-3">
        {navigation.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-md px-3 py-2 text-sm transition hover:bg-muted"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}