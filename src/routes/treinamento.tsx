import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, KeyRound, Search, ShieldCheck, Truck } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const PASSOS = [
  {
    icone: KeyRound,
    titulo: "1. Acesso com PIN",
    texto:
      "Na tela inicial selecione seu nome na lista de usuários e digite o PIN de 4 dígitos no teclado numérico. Contas desativadas não permitem acesso — procure o administrador.",
  },
  {
    icone: Truck,
    titulo: "2. Registro de descargas",
    texto:
      "Acesse Recebimento Interno ou Externo, clique em 'Nova descarga' e informe ASN/NF, divisão, placa, transportadora e volumes. Registre pallets quebrados/tombados, iLPNs ausentes ou inválidas e divergências físicas antes de salvar.",
  },
  {
    icone: BookOpen,
    titulo: "3. Diário de Bordo",
    texto:
      "Ao final do turno, na aba Acompanhamento, selecione a data e o turno, descreva os gargalos (queda do WMS, falta de empilhadeiras, atraso fiscal) e clique em 'Salvar diário'.",
  },
];

const GLOSSARIO = [
  {
    termo: "ASN (Advanced Shipping Notice)",
    def: "Aviso antecipado de embarque enviado pela fábrica de origem. Sem ASN o WMS não reconhece a carga e a descarga precisa de tratativa manual.",
  },
  {
    termo: "iLPN (Internal License Plate Number)",
    def: "Etiqueta de identificação única do pallet dentro do WMS. Deve estar presente, legível e válida em todo pallet recebido.",
  },
  {
    termo: "iLPN Ausente",
    def: "Pallet recebido sem a etiqueta iLPN colada ou com etiqueta perdida em trânsito.",
  },
  {
    termo: "iLPN Inválida",
    def: "Etiqueta presente porém não reconhecida pelo WMS: código duplicado, ilegível, danificado ou pertencente a outro embarque.",
  },
  {
    termo: "Pallet Quebrado",
    def: "Estrutura de madeira/plástico do pallet danificada, comprometendo o empilhamento e a segurança da armazenagem.",
  },
  {
    termo: "Pallet Tombado",
    def: "Carga desalinhada ou caída dentro do veículo, exigindo repaletização antes da entrada no estoque.",
  },
  {
    termo: "Divergência Física",
    def: "Diferença entre a quantidade de caixas efetivamente contadas na doca e a quantidade declarada no documento.",
  },
  {
    termo: "Divergência Fiscal",
    def: "Inconsistência entre a nota fiscal e a carga recebida (produto, quantidade faturada ou dados fiscais).",
  },
  {
    termo: "Produto Avariado",
    def: "Embalagem ou produto com dano físico (molhado, amassado, rasgado) identificado na conferência do recebimento externo.",
  },
  {
    termo: "Etiqueta Padrão Softys",
    def: "Layout obrigatório de identificação de volumes de fornecedores terceiros. Fora do padrão gera apontamento de não conformidade.",
  },
  {
    termo: "Meta de Turno",
    def: "Quantidade alvo de veículos descarregados por turno: 25 no recebimento interno e 5 no recebimento externo.",
  },
];

const PERFIS = [
  {
    nome: "Operador",
    cor: "bg-brand text-brand-foreground",
    itens: [
      "Registra e edita descargas do turno ativo",
      "Preenche o Diário de Bordo com justificativas",
      "Acessa o Portal de Treinamento",
      "Não exclui registros nem gerencia usuários",
    ],
  },
  {
    nome: "Auditor",
    cor: "bg-success text-success-foreground",
    itens: [
      "Visualiza dashboards operacionais",
      "Consulta relatórios consolidados mensais",
      "Audita divergências e conformidade",
      "Não cria nem edita descargas",
    ],
  },
  {
    nome: "Administrador",
    cor: "bg-warning text-warning-foreground",
    itens: [
      "Acesso total ao sistema",
      "Gerencia usuários: cadastro, edição, ativação e PIN",
      "Exclui registros operacionais",
      "Consulta o Histórico de Auditoria",
    ],
  },
];

function Treinamento() {
  const [busca, setBusca] = useState("");
  const q = busca.trim().toLowerCase();
  const glossario = GLOSSARIO.filter(
    (g) => !q || g.termo.toLowerCase().includes(q) || g.def.toLowerCase().includes(q),
  );

  return (
    <Tabs defaultValue="guia" className="space-y-4">
      <TabsList className="w-full justify-start overflow-x-auto">
        <TabsTrigger value="guia">Guia Rápido</TabsTrigger>
        <TabsTrigger value="glossario">Glossário</TabsTrigger>
        <TabsTrigger value="perfis">Perfis &amp; Permissões</TabsTrigger>
      </TabsList>

      <TabsContent value="guia" className="grid gap-4 lg:grid-cols-3">
        {PASSOS.map((p) => (
          <div key={p.titulo} className="card-surface p-6">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-brand">
              <p.icone className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-display text-lg font-semibold">{p.titulo}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.texto}</p>
          </div>
        ))}
      </TabsContent>

      <TabsContent value="glossario" className="space-y-4">
        <div className="card-surface p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar termo (ASN, iLPN, pallet tombado...)"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
        </div>
        <div className="card-surface px-5 py-2">
          <Accordion type="single" collapsible>
            {glossario.map((g) => (
              <AccordionItem key={g.termo} value={g.termo}>
                <AccordionTrigger className="text-left font-display">{g.termo}</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">{g.def}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          {glossario.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhum termo encontrado.
            </p>
          )}
        </div>
      </TabsContent>

      <TabsContent value="perfis" className="grid gap-4 lg:grid-cols-3">
        {PERFIS.map((p) => (
          <div key={p.nome} className="card-surface overflow-hidden">
            <div className={`flex items-center gap-2 px-5 py-4 ${p.cor}`}>
              <ShieldCheck className="h-5 w-5" />
              <h3 className="font-display text-lg font-semibold">{p.nome}</h3>
            </div>
            <ul className="space-y-2 p-5">
              {p.itens.map((i) => (
                <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                  {i}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </TabsContent>
    </Tabs>
  );
}

export const Route = createFileRoute("/treinamento")({
  head: () => ({
    meta: [
      { title: "Portal de Treinamento & Playbook | Inbound Softys × Kuehne+Nagel" },
      {
        name: "description",
        content:
          "Guia rápido de uso, glossário de ocorrências logísticas e matriz de perfis e permissões do controle inbound.",
      },
      { property: "og:title", content: "Portal de Treinamento & Playbook Operacional" },
      {
        property: "og:description",
        content: "Tutorial passo a passo, glossário técnico e responsabilidades por perfil.",
      },
    ],
  }),
  component: () => (
    <AppShell
      title="Portal de Treinamento & Playbook"
      subtitle="Tutorial de uso, glossário de ocorrências e matriz de responsabilidades."
    >
      <Treinamento />
    </AppShell>
  ),
});
