import { ShieldCheck, WalletCards } from "lucide-react";
import { SignOutButton } from "@/components/dashboard/sign-out-button";

type DashboardHeaderProps = { name: string; role: "ADMIN" | "FAMILY" };

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "").join("");
}

export function DashboardHeader({ name, role }: DashboardHeaderProps) {
  const roleLabel = role === "ADMIN" ? "Administrador" : "Família";

  return (
    <header className="app-header">
      <a className="brand" href="/dashboard" aria-label="Family Finance, visão geral">
        <span className="brand-mark"><WalletCards size={18} strokeWidth={1.7} /></span>
        <span className="brand-copy">
          <strong>Family Finance</strong>
          <small>Controle financeiro familiar</small>
        </span>
      </a>
      <div className="header-user">
        <span className="role-pill"><ShieldCheck size={13} />{roleLabel}</span>
        <span className="user-avatar" aria-hidden="true">{initials(name) || "FF"}</span>
        <span className="user-name">{name}</span>
        <SignOutButton />
      </div>
    </header>
  );
}
