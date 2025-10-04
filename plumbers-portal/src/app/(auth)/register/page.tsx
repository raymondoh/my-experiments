import { RegisterForm } from "@/components/auth/register-form";

interface RegisterPageProps {
  searchParams: Promise<{ role?: string }>;
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = await searchParams;
  const defaultRole = params?.role ?? "customer";

  // The AuthLayout now handles all centering and width constraints.
  // This page component only needs to render the form itself.
  return <RegisterForm defaultRole={defaultRole} />;
}
