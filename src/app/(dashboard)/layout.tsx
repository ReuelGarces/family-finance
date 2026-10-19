import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { requireUser } from "@/lib/auth/guards";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await requireUser();

  return (
    <div className="app-shell">
      <DashboardHeader name={user.name} role={user.role} />
      <main className="dashboard-main">{children}</main>
    </div>
  );
}
