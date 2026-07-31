import { ReactNode } from "react";

import { PublicLayout } from "@/components/layout/PublicLayout";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({
  children,
}: LayoutProps) {
  return (
    <PublicLayout>
      {children}
    </PublicLayout>
  );
}