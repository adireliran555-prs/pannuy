import { requireAdminPage } from "@/lib/api-auth";

// Server-side guard for every admin page except /admin/login (which lives
// outside this route group). Middleware already verifies the JWT signature;
// this is defense in depth so a page can never render admin data unauthenticated.
export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdminPage();
  return <>{children}</>;
}
