import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  AuditoriaLog,
  DiarioBordo,
  Perfil,
  Registro,
  Turno,
  Usuario,
} from "./types";

const KEY = "inbound-softys-kn-v1";

interface DB {
  usuarios: Usuario[];
  registros: Registro[];
  diarios: DiarioBordo[];
  logs: AuditoriaLog[];
}

const uid = () => Math.random().toString(36).slice(2, 10);

const USUARIOS_SEED: Usuario[] = [
  { id: "u1", nome: "Marcos Ribeiro", perfil: "OPERADOR", pin: "1111", ativo: true },
  { id: "u2", nome: "Juliana Prado", perfil: "OPERADOR", pin: "2222", ativo: true },
  { id: "u3", nome: "Carlos Menezes", perfil: "AUDITOR", pin: "3333", ativo: true },
  { id: "u4", nome: "Renata Lopes", perfil: "ADMIN", pin: "4444", ativo: true },
];

const TRANSP = [
  "Kuehne+Nagel",
  "Transportes Andorinha",
  "Rodoviário Sul",
  "TransLog Express",
  "Via Norte Cargas",
];
const PLACAS = ["RTX3D45", "KLM7A21", "BRA2E19", "FGH8B03", "QWE4C77", "ZXC9D12"];

function seedRegistros(): Registro[] {
  const out: Registro[] = [];
  const hoje = new Date();
  for (let d = 44; d >= 0; d--) {
    const dt = new Date(hoje);
    dt.setDate(hoje.getDate() - d);
    const data = dt.toISOString().slice(0, 10);
    const turnos: Turno[] = ["T1", "T2", "T3"];
    for (const turno of turnos) {
      const internos = 5 + Math.floor(Math.random() * 5);
      const externos = 1 + Math.floor(Math.random() * 2);
      for (let i = 0; i < internos + externos; i++) {
        const tipo = i < internos ? "INTERNO" : "EXTERNO";
        const anomalia = Math.random() < 0.32;
        out.push({
          id: uid(),
          tipo,
          data,
          turno,
          documento:
            tipo === "INTERNO"
              ? `ASN-${100000 + Math.floor(Math.random() * 899999)}`
              : `NF-${10000 + Math.floor(Math.random() * 89999)}`,
          divisao: Math.random() < 0.55 ? "TISSUE" : "PERSONAL",
          placa: PLACAS[Math.floor(Math.random() * PLACAS.length)]!,
          transportadora: TRANSP[Math.floor(Math.random() * TRANSP.length)]!,
          volumes: 120 + Math.floor(Math.random() * 700),
          palletsQuebrados: anomalia && Math.random() < 0.5 ? 1 + Math.floor(Math.random() * 3) : 0,
          palletsTombados: anomalia && Math.random() < 0.35 ? 1 + Math.floor(Math.random() * 2) : 0,
          ilpnAusentes:
            anomalia && tipo === "INTERNO" && Math.random() < 0.4
              ? 1 + Math.floor(Math.random() * 4)
              : 0,
          ilpnInvalidas:
            anomalia && tipo === "INTERNO" && Math.random() < 0.35
              ? 1 + Math.floor(Math.random() * 3)
              : 0,
          divergenciaCaixas: anomalia && Math.random() < 0.3 ? 1 + Math.floor(Math.random() * 12) : 0,
          produtosAvariados:
            anomalia && tipo === "EXTERNO" && Math.random() < 0.5
              ? 1 + Math.floor(Math.random() * 6)
              : 0,
          semAsn: anomalia && tipo === "INTERNO" && Math.random() < 0.2,
          etiquetaNaoConforme: anomalia && tipo === "EXTERNO" && Math.random() < 0.3,
          observacao: "",
          criadoPor: "Marcos Ribeiro",
          criadoEm: new Date(dt).toISOString(),
        });
      }
    }
  }
  return out;
}

function initialDB(): DB {
  return {
    usuarios: USUARIOS_SEED,
    registros: seedRegistros(),
    diarios: [],
    logs: [
      {
        id: uid(),
        ts: new Date().toISOString(),
        usuario: "Sistema",
        perfil: "ADMIN",
        acao: "Base operacional inicializada com dados de demonstração",
        tipo: "CRIACAO",
      },
    ],
  };
}

interface StoreCtx extends DB {
  usuarioAtual: Usuario | null;
  login: (id: string, pin: string) => boolean;
  logout: () => void;
  salvarRegistro: (r: Omit<Registro, "id" | "criadoPor" | "criadoEm"> & { id?: string }) => void;
  excluirRegistro: (id: string) => void;
  salvarDiario: (data: string, turno: Turno, texto: string) => void;
  salvarUsuario: (u: Omit<Usuario, "id"> & { id?: string }) => void;
  alternarUsuario: (id: string) => void;
}

const Ctx = createContext<StoreCtx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DB | null>(null);
  const [usuarioAtual, setUsuarioAtual] = useState<Usuario | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        setDb(JSON.parse(raw) as DB);
        return;
      }
    } catch {
      /* ignore */
    }
    const fresh = initialDB();
    setDb(fresh);
    try {
      localStorage.setItem(KEY, JSON.stringify(fresh));
    } catch {
      /* ignore */
    }
  }, []);

  const persist = useCallback((next: DB) => {
    setDb(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  const log = useCallback(
    (base: DB, acao: string, tipo: AuditoriaLog["tipo"], user?: Usuario | null): DB => {
      const u = user ?? usuarioAtual;
      const entry: AuditoriaLog = {
        id: uid(),
        ts: new Date().toISOString(),
        usuario: u?.nome ?? "Sistema",
        perfil: u?.perfil ?? "ADMIN",
        acao,
        tipo,
      };
      return { ...base, logs: [entry, ...base.logs].slice(0, 500) };
    },
    [usuarioAtual],
  );

  const value = useMemo<StoreCtx>(() => {
    const cur: DB = db ?? { usuarios: USUARIOS_SEED, registros: [], diarios: [], logs: [] };
    return {
      ...cur,
      usuarioAtual,
      login: (id, pin) => {
        const u = cur.usuarios.find((x) => x.id === id);
        if (!u || !u.ativo || u.pin !== pin) return false;
        setUsuarioAtual(u);
        persist(log(cur, `Login realizado no sistema`, "CRIACAO", u));
        return true;
      },
      logout: () => setUsuarioAtual(null),
      salvarRegistro: (r) => {
        if (r.id) {
          const registros = cur.registros.map((x) =>
            x.id === r.id ? ({ ...x, ...r, id: r.id } as Registro) : x,
          );
          persist(
            log({ ...cur, registros }, `Editou descarga ${r.documento} (${r.tipo})`, "ALTERACAO"),
          );
        } else {
          const novo: Registro = {
            ...r,
            id: uid(),
            criadoPor: usuarioAtual?.nome ?? "Sistema",
            criadoEm: new Date().toISOString(),
          };
          persist(
            log(
              { ...cur, registros: [novo, ...cur.registros] },
              `Registrou descarga ${novo.documento} (${novo.tipo})`,
              "CRIACAO",
            ),
          );
        }
      },
      excluirRegistro: (id) => {
        const alvo = cur.registros.find((x) => x.id === id);
        persist(
          log(
            { ...cur, registros: cur.registros.filter((x) => x.id !== id) },
            `Excluiu descarga ${alvo?.documento ?? id}`,
            "EXCLUSAO",
          ),
        );
      },
      salvarDiario: (data, turno, texto) => {
        const id = `${data}|${turno}`;
        const existe = cur.diarios.some((d) => d.id === id);
        const entry: DiarioBordo = {
          id,
          data,
          turno,
          texto,
          autor: usuarioAtual?.nome ?? "Sistema",
          atualizadoEm: new Date().toISOString(),
        };
        const diarios = existe
          ? cur.diarios.map((d) => (d.id === id ? entry : d))
          : [entry, ...cur.diarios];
        persist(
          log(
            { ...cur, diarios },
            `${existe ? "Atualizou" : "Registrou"} diário de bordo ${data} ${turno}`,
            existe ? "ALTERACAO" : "CRIACAO",
          ),
        );
      },
      salvarUsuario: (u) => {
        if (u.id) {
          const usuarios = cur.usuarios.map((x) =>
            x.id === u.id ? ({ ...x, ...u, id: u.id } as Usuario) : x,
          );
          persist(log({ ...cur, usuarios }, `Atualizou usuário ${u.nome}`, "ALTERACAO"));
        } else {
          const novo: Usuario = { ...u, id: uid() };
          persist(
            log({ ...cur, usuarios: [...cur.usuarios, novo] }, `Cadastrou usuário ${u.nome}`, "CRIACAO"),
          );
        }
      },
      alternarUsuario: (id) => {
        const usuarios = cur.usuarios.map((x) => (x.id === id ? { ...x, ativo: !x.ativo } : x));
        const alvo = usuarios.find((x) => x.id === id);
        persist(
          log(
            { ...cur, usuarios },
            `${alvo?.ativo ? "Ativou" : "Desativou"} usuário ${alvo?.nome}`,
            "ALTERACAO",
          ),
        );
      },
    };
  }, [db, usuarioAtual, persist, log]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore deve ser usado dentro de StoreProvider");
  return ctx;
}

export function podeEditar(perfil?: Perfil) {
  return perfil === "OPERADOR" || perfil === "ADMIN";
}
