"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button className="sign-out" type="button"
      onClick={() => signOut({ redirectTo: "/login" })}
      aria-label="Sair da conta" title="Sair da conta">
      <LogOut size={15} strokeWidth={1.8} />
      Sair
    </button>
  );
}
