/// src/app/dashboard/page.tsx
import { redirect } from "next/navigation";
import { auth } from "@/auth";

// This page now acts as a simple, server-side redirector based on user role.
export default async function DashboardRootPage() {
  const session = await auth();

  // If for any reason there's no session, redirect to login.
  if (!session?.user) {
    redirect("/login");
  }

  const { role } = session.user;

  // Redirect to the appropriate dashboard based on the user's role.
  switch (role) {
    case "admin":
      redirect("/dashboard/admin");
      break;
    case "tradesperson":
      redirect("/dashboard/tradesperson");
      break;
    case "business_owner":
      redirect("/dashboard/business-owner");
      break;
    case "customer":
      redirect("/dashboard/customer");
      break;
    default:
      // Fallback for any other roles or if the role is not recognized.
      // You could redirect to a generic page or show an error.
      // For now, we'll send them to the login page as a safe default.
      redirect("/login");
      break;
  }

  // This part of the code will not be reached due to the redirects above,
  // but it's good practice to have a return statement.
  return null;
}
