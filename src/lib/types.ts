export type Perfil = "OPERADOR" | "AUDITOR" | "ADMIN";
export type Turno = "T1" | "T2" | "T3";
export type TipoReceb = "INTERNO" | "EXTERNO";
export type Divisao = "TISSUE" | "PERSONAL";

export interface Usuario {
  id: string;
  nome: string;
  perfil: Perfil;
  pin: string;
  ativo: boolean;
}

export interface Registro {
  id: string;
  tipo: TipoReceb;
  data: string; // yyyy-mm-dd
  turno: Turno;
  documento: string; // ASN ou NF
  divisao: Divisao;
  placa: string;
  transportadora: string;
  volumes: number;
  palletsQuebrados: number;
  palletsTombados: number;
  ilpnAusentes: number;
  ilpnInvalidas: number;
  divergenciaCaixas: number;
  produtosAvariados: number;
  semAsn: boolean;
  etiquetaNaoConforme: boolean;
  observacao: string;
  criadoPor: string;
  criadoEm: string;
}

export interface DiarioBordo {
  id: string; // data|turno
  data: string;
  turno: Turno;
  texto: string;
  autor: string;
  atualizadoEm: string;
}

export interface AuditoriaLog {
  id: string;
  ts: string;
  usuario: string;
  perfil: Perfil;
  acao: string;
  tipo: "CRIACAO" | "ALTERACAO" | "EXCLUSAO";
}

export const TURNOS: { id: Turno; label: string; faixa: string }[] = [
  { id: "T1", label: "Turno 1", faixa: "06h – 14h" },
  { id: "T2", label: "Turno 2", faixa: "14h – 22h" },
  { id: "T3", label: "Turno 3", faixa: "22h – 06h" },
];

export const METAS: Record<TipoReceb, number> = { INTERNO: 25, EXTERNO: 5 };

export function anomaliasDoRegistro(r: Registro): number {
  return (
    r.palletsQuebrados +
    r.palletsTombados +
    r.ilpnAusentes +
    r.ilpnInvalidas +
    r.divergenciaCaixas +
    r.produtosAvariados +
    (r.semAsn ? 1 : 0) +
    (r.etiquetaNaoConforme ? 1 : 0)
  );
}

export function isConforme(r: Registro): boolean {
  return anomaliasDoRegistro(r) === 0;
}
