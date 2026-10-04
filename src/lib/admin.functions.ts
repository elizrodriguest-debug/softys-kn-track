import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { isValidPin, normalizeUsername, pinToPassword, usernameToEmail } from "./auth-utils";

const roleSchema = z.enum(["ADMINISTRADOR", "OPERACIONAL", "VISUALIZADOR"]);
const statusSchema = z.enum(["ATIVO", "INATIVO", "PENDENTE"]);
const pinSchema = z.string().refine(isValidPin, "PIN deve ter de 4 a 8 dígitos numéricos");
const usernameSchema = z
  .string()
  .transform(normalizeUsername)
  .refine((u) => u.length >= 3, "Usuário deve ter ao menos 3 caracteres");

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("is_admin", { _user_id: userId });
  if (error || !data) throw new Error("Acesso negado: somente administradores.");
}

async function createAuthUser(
  admin: any,
  input: { fullName: string; username: string; pin: string; role: string; status: string },
  createdBy: string | null,
) {
  const { data: exists } = await admin
    .from("profiles")
    .select("id")
    .eq("username", input.username)
    .maybeSingle();
  if (exists) throw new Error("Já existe um usuário com este nome de usuário.");

  const { data, error } = await admin.auth.admin.createUser({
    email: usernameToEmail(input.username),
    password: pinToPassword(input.pin),
    email_confirm: true,
    user_metadata: { username: input.username, full_name: input.fullName },
  });
  if (error || !data.user) throw new Error(error?.message ?? "Falha ao criar usuário.");
  const id = data.user.id;
  const { error: pErr } = await admin.from("profiles").insert({
    id,
    full_name: input.fullName,
    username: input.username,
    status: input.status,
    created_by: createdBy,
  });
  if (pErr) {
    await admin.auth.admin.deleteUser(id);
    throw new Error(pErr.message);
  }
  await admin.from("user_roles").insert({ user_id: id, role: input.role });
  if (input.status !== "ATIVO") {
    await admin.auth.admin.updateUserById(id, { ban_duration: "876000h" });
  }
  return id;
}

/** Indica se o sistema ainda não possui administrador (primeiro acesso). */
export const needsBootstrap = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { count } = await supabaseAdmin
    .from("user_roles")
    .select("id", { count: "exact", head: true })
    .eq("role", "ADMINISTRADOR");
  return { needed: (count ?? 0) === 0 };
});

/** Cria o primeiro Administrador. Só funciona enquanto não existir nenhum. */
export const bootstrapAdmin = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({ fullName: z.string().trim().min(2), username: usernameSchema, pin: pinSchema }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "ADMINISTRADOR");
    if ((count ?? 0) > 0) throw new Error("O primeiro administrador já foi definido.");
    await createAuthUser(supabaseAdmin, { ...data, role: "ADMINISTRADOR", status: "ATIVO" }, null);
    return { ok: true };
  });

export const listUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const [{ data: profiles }, { data: roles }] = await Promise.all([
      context.supabase.from("profiles").select("*").order("full_name"),
      context.supabase.from("user_roles").select("user_id, role"),
    ]);
    return (profiles ?? []).map((p) => ({
      id: p.id,
      fullName: p.full_name,
      username: p.username,
      status: p.status as string,
      role: (roles ?? []).find((r) => r.user_id === p.id)?.role ?? "VISUALIZADOR",
      createdAt: p.created_at,
    }));
  });

export const createUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        fullName: z.string().trim().min(2),
        username: usernameSchema,
        pin: pinSchema,
        role: roleSchema,
        status: statusSchema,
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await createAuthUser(supabaseAdmin, data, context.userId);
    return { ok: true };
  });

export const updateUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        id: z.string().uuid(),
        fullName: z.string().trim().min(2),
        role: roleSchema,
        status: statusSchema,
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    if (data.id === context.userId && (data.role !== "ADMINISTRADOR" || data.status !== "ATIVO")) {
      throw new Error("Você não pode remover seu próprio acesso de administrador.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ full_name: data.fullName, status: data.status, updated_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.id);
    await supabaseAdmin.from("user_roles").insert({ user_id: data.id, role: data.role });
    await supabaseAdmin.auth.admin.updateUserById(data.id, {
      ban_duration: data.status === "ATIVO" ? "none" : "876000h",
    });
    return { ok: true };
  });

export const resetPin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid(), pin: pinSchema }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.id, {
      password: pinToPassword(data.pin),
    });
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("audit_log").insert({
      table_name: "profiles",
      record_id: data.id,
      action: "RESET_PIN",
      changed_by: context.userId,
    });
    return { ok: true };
  });

export const listAudit = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("audit_log")
      .select("id, table_name, record_id, action, changed_by_name, created_at")
      .order("created_at", { ascending: false })
      .limit(300);
    if (error) throw new Error(error.message);
    return data ?? [];
  });
