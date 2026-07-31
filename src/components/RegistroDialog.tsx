import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStore } from "@/lib/store";
import { TURNOS, type Divisao, type Registro, type TipoReceb, type Turno } from "@/lib/types";

type Draft = Omit<Registro, "id" | "criadoPor" | "criadoEm"> & { id?: string };

function novoDraft(tipo: TipoReceb, data: string, turno: Turno): Draft {
  return {
    tipo,
    data,
    turno,
    documento: "",
    divisao: "TISSUE",
    placa: "",
    transportadora: "",
    volumes: 0,
    palletsQuebrados: 0,
    palletsTombados: 0,
    ilpnAusentes: 0,
    ilpnInvalidas: 0,
    divergenciaCaixas: 0,
    produtosAvariados: 0,
    semAsn: false,
    etiquetaNaoConforme: false,
    observacao: "",
  };
}

export function RegistroDialog({
  open,
  onOpenChange,
  tipo,
  data,
  turno,
  registro,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tipo: TipoReceb;
  data: string;
  turno: Turno;
  registro?: Registro | null;
}) {
  const { salvarRegistro } = useStore();
  const [d, setD] = useState<Draft>(novoDraft(tipo, data, turno));

  useEffect(() => {
    if (open) setD(registro ? { ...registro } : novoDraft(tipo, data, turno));
  }, [open, registro, tipo, data, turno]);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((p) => ({ ...p, [k]: v }));
  const num = (k: keyof Draft) => (
    <Input
      type="number"
      min={0}
      value={String(d[k] as number)}
      onChange={(e) => set(k, (Number(e.target.value) || 0) as never)}
    />
  );

  const submit = () => {
    if (!d.documento.trim()) {
      toast.error(tipo === "INTERNO" ? "Informe o número da ASN." : "Informe o número da NF.");
      return;
    }
    if (!d.placa.trim()) {
      toast.error("Informe a placa do veículo.");
      return;
    }
    salvarRegistro(d);
    toast.success(registro ? "Descarga atualizada." : "Descarga registrada.");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display">
            {registro ? "Editar descarga" : "Nova descarga"} —{" "}
            {tipo === "INTERNO" ? "Recebimento Interno" : "Recebimento Externo"}
          </DialogTitle>
          <DialogDescription>
            Preencha os dados da descarga e registre as ocorrências identificadas na doca.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>{tipo === "INTERNO" ? "Número da ASN" : "Nota Fiscal"}</Label>
            <Input
              value={d.documento}
              onChange={(e) => set("documento", e.target.value)}
              placeholder={tipo === "INTERNO" ? "ASN-123456" : "NF-45678"}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Divisão</Label>
            <Select value={d.divisao} onValueChange={(v) => set("divisao", v as Divisao)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TISSUE">Tissue</SelectItem>
                <SelectItem value="PERSONAL">Personal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Data</Label>
            <Input type="date" value={d.data} onChange={(e) => set("data", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Turno</Label>
            <Select value={d.turno} onValueChange={(v) => set("turno", v as Turno)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TURNOS.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.label} ({t.faixa})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Placa do veículo</Label>
            <Input
              value={d.placa}
              onChange={(e) => set("placa", e.target.value.toUpperCase())}
              placeholder="ABC1D23"
              maxLength={8}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Transportadora</Label>
            <Input
              value={d.transportadora}
              onChange={(e) => set("transportadora", e.target.value)}
              placeholder="Kuehne+Nagel"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Total de volumes / pallets descarregados</Label>
            {num("volumes")}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-secondary/60 p-4">
          <p className="font-display text-sm font-semibold">Ocorrências</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Pallets quebrados</Label>
              {num("palletsQuebrados")}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Pallets tombados</Label>
              {num("palletsTombados")}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Divergência física (caixas)</Label>
              {num("divergenciaCaixas")}
            </div>
            {tipo === "INTERNO" ? (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs">iLPNs ausentes</Label>
                  {num("ilpnAusentes")}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">iLPNs inválidas</Label>
                  {num("ilpnInvalidas")}
                </div>
              </>
            ) : (
              <div className="space-y-1.5">
                <Label className="text-xs">Produtos avariados</Label>
                {num("produtosAvariados")}
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-col gap-3">
            {tipo === "INTERNO" ? (
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={d.semAsn}
                  onCheckedChange={(v) => set("semAsn", Boolean(v))}
                />
                Veículo recebido sem ASN
              </label>
            ) : (
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={d.etiquetaNaoConforme}
                  onCheckedChange={(v) => set("etiquetaNaoConforme", Boolean(v))}
                />
                Etiqueta fora do padrão Softys
              </label>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Observações</Label>
          <Textarea
            value={d.observacao}
            onChange={(e) => set("observacao", e.target.value)}
            placeholder="Detalhes adicionais da descarga..."
            rows={3}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={submit}>{registro ? "Salvar alterações" : "Registrar descarga"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
