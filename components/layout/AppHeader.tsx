import { ThemeToggle } from "@/components/theme/ThemeToggle";

export function AppHeader() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
      <div>
              <p className="text-sm text-muted-foreground">
          Panel administrativo
        </p>
      </div>

     <div className="flex items-center gap-3">
  <div className="text-right">
    <p className="text-sm font-medium text-foreground">
      Administrador
    </p>

    <p className="text-xs text-muted-foreground">
      Clínica Veterinaria
    </p>
  </div>

  <ThemeToggle />
</div>
    </header>
  );
}