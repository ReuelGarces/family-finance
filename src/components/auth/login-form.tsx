"use client";

import { signIn } from "next-auth/react";
import { useState, type FormEvent } from "react";

export function LoginForm() {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        redirectTo: "/dashboard",
      });

      if (!result || result.error || !result.ok) {
        setError("E-mail ou senha inválidos. Confira os dados e tente novamente.");
        setPending(false);
        return;
      }

      window.location.assign(result.url || "/dashboard");
    } catch {
      setError("Não foi possível entrar agora. Tente novamente em instantes.");
      setPending(false);
    }
  }

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="email">E-mail</label>
        <input id="email" name="email" type="email" autoComplete="username"
          placeholder="voce@exemplo.com" required maxLength={254} />
      </div>
      <div className="field">
        <label htmlFor="password">Senha</label>
        <input id="password" name="password" type="password" autoComplete="current-password"
          placeholder="Digite sua senha" required minLength={1} maxLength={128} />
      </div>
      {error ? <p className="login-error" role="alert">{error}</p> : null}
      <button className="login-submit" type="submit" disabled={pending}>
        {pending ? "Verificando..." : "Entrar"}
      </button>
    </form>
  );
}
