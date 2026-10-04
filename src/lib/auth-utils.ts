/** Login por Usuário + PIN: o usuário vira um e-mail interno e o PIN é derivado em uma senha.
 *  O hash seguro (bcrypt) do PIN é feito pelo serviço de autenticação. */
export const normalizeUsername = (u: string) =>
  u.trim().toLowerCase().replace(/[^a-z0-9._-]/g, "");

export const usernameToEmail = (u: string) => `${normalizeUsername(u)}@usuarios.inbound.local`;

export const pinToPassword = (pin: string) => `KN-inbound#${pin.trim()}#pin`;

export const isValidPin = (pin: string) => /^\d{4,8}$/.test(pin.trim());

export type AppRole = "ADMINISTRADOR" | "OPERACIONAL" | "VISUALIZADOR";
export type UserStatus = "ATIVO" | "INATIVO" | "PENDENTE";
