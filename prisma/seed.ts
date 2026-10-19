import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";

type InitialRole = "ADMIN" | "FAMILY";

async function createInitialUser(role: InitialRole) {
  const existing = await prisma.user.findFirst({ where: { role } });

  if (existing) {
    console.info(`Conta inicial ${role} já existe; mantida sem alterações.`);
    return;
  }

  const prefix = role === "ADMIN" ? "INITIAL_ADMIN" : "INITIAL_FAMILY";
  const email = process.env[`${prefix}_EMAIL`]?.trim().toLowerCase();
  const password = process.env[`${prefix}_PASSWORD`];
  const fallbackName = role === "ADMIN" ? "Administrador" : "Família";
  const name = process.env[`${prefix}_NAME`]?.trim() || fallbackName;

  if (!email || !password) {
    throw new Error(`Defina ${prefix}_EMAIL e ${prefix}_PASSWORD antes da criação inicial das contas.`);
  }

  if (password.length < 12) {
    throw new Error(`${prefix}_PASSWORD deve ter pelo menos 12 caracteres.`);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: { email, name, passwordHash, role },
  });

  console.info(`Conta inicial ${role} criada.`);
}

async function main() {
  const adminEmail = process.env.INITIAL_ADMIN_EMAIL?.trim().toLowerCase();
  const familyEmail = process.env.INITIAL_FAMILY_EMAIL?.trim().toLowerCase();

  if (adminEmail && familyEmail && adminEmail === familyEmail) {
    throw new Error("As contas ADMIN e FAMILY precisam usar e-mails diferentes.");
  }

  await createInitialUser("ADMIN");
  await createInitialUser("FAMILY");
}

main()
  .catch((error: unknown) => {
    console.error("Falha ao preparar as contas iniciais.");
    console.error(error instanceof Error ? error.message : "Erro desconhecido.");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
