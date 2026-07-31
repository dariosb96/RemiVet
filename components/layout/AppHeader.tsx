export function AppHeader() {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6">
      <div>
        <h1 className="text-lg font-semibold">RemiVet</h1>
        <p className="text-sm text-muted-foreground">
          Panel administrativo
        </p>
      </div>

      <div className="text-sm text-muted-foreground">
        Administrador
      </div>
    </header>
  );
}