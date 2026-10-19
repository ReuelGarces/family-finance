import { auth } from "@/auth";
import { LoginForm } from "@/components/auth/login-form";
import { redirect } from "next/navigation";
import { WalletCards } from "lucide-react";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <div className="brand login-brand">
          <span className="brand-mark"><WalletCards size={18} strokeWidth={1.7} /></span>
          <span className="brand-copy">
            <strong>Family Finance</strong>
            <small>Controle financeiro familiar</small>
          </span>
        </div>
        <div className="login-heading">
          <h1 id="login-title">Acesse sua conta</h1>
          <p>Entre com o acesso criado pelo administrador da família.</p>
        </div>
        <LoginForm />
        <p className="login-footnote">Acesso privado · Cadastro público desativado</p>
      </section>
    </main>
  );
}
