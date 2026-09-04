import { prisma } from "@/lib/prisma";
import LoginForm from "./components/login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const userCount = await prisma.user.count();

  return (
    <LoginForm
      hasInitialAdmin={userCount > 0}
    />
  );
}