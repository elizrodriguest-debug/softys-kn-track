import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Save, Truck } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  DEFAULT_PALLETS_PER_VEHICLE,
  DIVISION_LABEL,
  EXTERNAL_OPERATIONS,
  FACTORIES,
  shiftFromTime,
  type DischargeRecord,
  type DivisionType,
  type ExternalOperationType,
  type FactoryType,
} from "@/lib/types";
import { shiftLabel } from "@/lib/analytics";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/registrar")({
  head: () => ({
    meta: [
      { title: "Registrar Descarga | Softys × Kuehne+Nagel" },
      {
        name: "description",
        content:
          "Formulário de registro de descargas do recebimento interno e externo, com não-conformidades e identificação automática de turno.",
      },
      { property: "og:title", content: "Registrar Descarga | Softys × Kuehne+Nagel" },
      {
        property: "og:description",
        content: "Lance veículos, volumes, ASN, notas fiscais e ocorrências do CD Caieiras.",
      },
    ],
  }),
  component: RegistrarPage,
});

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

function NumField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Field label={label}>
      <Input type="number" min={0} value={value} onChange={(e) => onChange(e.target.value)} />
    </Field>
  );
}

const num = (v: string) => Math.max(0, Number(v) || 0);

function RegistrarPage() {
  const { saveRecord, session } = useStore();
  const router = useRouter();

  const [division, setDivision] = useState<DivisionType>("INTERNO");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5));
  const [dockNumber, setDock] = useState("");
  const [carrierName, setCarrier] = useState("");
  const [licensePlate, setPlate] = useState("");
  const [driverName, setDriver] = useState("");
  const [totalVolumes, setVolumes] = useState(String(DEFAULT_PALLETS_PER_VEHICLE));
  const [notes, setNotes] = useState("");

  // Interno
  const [factoryType, setFactory] = useState<FactoryType>("Tissue");
  const [asnNumber, setAsn] = useState("");
  const [missingAsn, setMissingAsn] = useState(false);
  const [missingAsnQuantity, setMissingAsnQty] = useState("0");
  const [asnDivergenceDetails, setAsnDiv] = useState("");
  const [brokenPalletsCount, setBroken] = useState("0");
  const [fallenPalletsCount, setFallen] = useState("0");
  const [invalidILPNCount, setInvalidIlpn] = useState("0");
  const [missingILPNShipmentCount, setMissingIlpn] = useState("0");

  // Externo
  const [operationType, setOperation] = useState<ExternalOperationType>("Importação");
  const [invoiceNumber, setInvoice] = useState("");
  const [invoiceQuantity, setInvoiceQty] = useState("0");
  const [vehicleQuantity, setVehicleQty] = useState("0");
  const [hasQuantityDivergence, setHasDiv] = useState(false);
  const [missingStandardLabel, setMissingLabel] = useState(false);
  const [damagedProductsCount, setDamaged] = useState("0");
  const [entryDivergenceDetails, setEntryDiv] = useState("");

  const turno = useMemo(() => shiftFromTime(time), [time]);

  const submit = () => {
    const base = {
      division,
      date,
      time,
      shiftId: turno,
      dockNumber,
      carrierName,
      licensePlate,
      driverName,
      notes,
      totalVolumes: num(totalVolumes),
      createdBy: session.operatorName,
    };

    const record: Omit<DischargeRecord, "id" | "createdAt"> =
      division === "INTERNO"
        ? {
            ...base,
            factoryType,
            asnNumber,
            missingAsn,
            missingAsnQuantity: missingAsn ? num(missingAsnQuantity) : 0,
            asnDivergenceDetails,
            brokenPalletsCount: num(brokenPalletsCount),
            fallenPalletsCount: num(fallenPalletsCount),
            invalidILPNCount: num(invalidILPNCount),
            missingILPNShipmentCount: num(missingILPNShipmentCount),
          }
        : {
            ...base,
            operationType,
            invoiceNumber,
            invoiceQuantity: num(invoiceQuantity),
            vehicleQuantity: num(vehicleQuantity),
            hasQuantityDivergence,
            divergentQuantityAmount: hasQuantityDivergence
              ? Math.abs(num(invoiceQuantity) - num(vehicleQuantity))
              : 0,
            missingStandardLabel,
            damagedProductsCount: num(damagedProductsCount),
            fallenPalletsCount: num(fallenPalletsCount),
            entryDivergenceDetails,
          };

    saveRecord(record);
    toast.success("Descarga registrada com sucesso.");
    router.navigate({ to: "/historico" });
  };

  return (
    <AppShell
      title="Registrar Descarga"
      subtitle="Lançamento de veículos descarregados, volumes e não-conformidades."
    >
      <div className="mb-5 inline-flex rounded-lg border border-border bg-card p-1">
        {(["INTERNO", "EXTERNO"] as DivisionType[]).map((d) => (
          <button
            key={d}
            onClick={() => setDivision(d)}
            className={cn(
              "rounded-md px-4 py-2 text-sm font-medium transition-colors",
              division === d
                ? "bg-brand text-brand-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {DIVISION_LABEL[d]}
          </button>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 font-display text-base font-semibold">
            <Truck className="h-4 w-4" /> Dados da descarga
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Data">
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
            <Field label={`Horário — turno identificado: ${shiftLabel(turno)}`}>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </Field>
            <Field label="Doca">
              <Input value={dockNumber} onChange={(e) => setDock(e.target.value)} />
            </Field>
            <Field label="Transportadora">
              <Input value={carrierName} onChange={(e) => setCarrier(e.target.value)} />
            </Field>
            <Field label="Placa">
              <Input value={licensePlate} onChange={(e) => setPlate(e.target.value)} />
            </Field>
            <Field label="Motorista">
              <Input value={driverName} onChange={(e) => setDriver(e.target.value)} />
            </Field>
            <NumField label="Volumes" value={totalVolumes} onChange={setVolumes} />
            {division === "INTERNO" ? (
              <Field label="Fábrica / Origem">
                <Select value={factoryType} onValueChange={(v) => setFactory(v as FactoryType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FACTORIES.map((f) => (
                      <SelectItem key={f} value={f}>
                        {f}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            ) : (
              <Field label="Tipo de Operação">
                <Select
                  value={operationType}
                  onValueChange={(v) => setOperation(v as ExternalOperationType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXTERNAL_OPERATIONS.map((o) => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
            <Field label="Observações" className="sm:col-span-2">
              <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </Field>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-4 font-display text-base font-semibold">
            Não-conformidades — {DIVISION_LABEL[division]}
          </h2>

          {division === "INTERNO" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Número do ASN">
                <Input value={asnNumber} onChange={(e) => setAsn(e.target.value)} />
              </Field>
              <div className="flex items-end gap-2 pb-2">
                <Checkbox
                  id="missingAsn"
                  checked={missingAsn}
                  onCheckedChange={(v) => setMissingAsn(v === true)}
                />
                <label htmlFor="missingAsn" className="text-sm">
                  Carga sem ASN
                </label>
              </div>
              {missingAsn && (
                <NumField
                  label="Volumes sem ASN"
                  value={missingAsnQuantity}
                  onChange={setMissingAsnQty}
                />
              )}
              <NumField
                label="Pallets Quebrados"
                value={brokenPalletsCount}
                onChange={setBroken}
              />
              <NumField label="Pallets Tombados" value={fallenPalletsCount} onChange={setFallen} />
              <NumField label="iLPN Inválida" value={invalidILPNCount} onChange={setInvalidIlpn} />
              <NumField
                label="iLPN Ausente"
                value={missingILPNShipmentCount}
                onChange={setMissingIlpn}
              />
              <Field label="Divergência de ASN (descrição)" className="sm:col-span-2">
                <Textarea rows={3} value={asnDivergenceDetails} onChange={(e) => setAsnDiv(e.target.value)} />
              </Field>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nota Fiscal">
                <Input value={invoiceNumber} onChange={(e) => setInvoice(e.target.value)} />
              </Field>
              <div className="flex items-end gap-2 pb-2">
                <Checkbox
                  id="hasDiv"
                  checked={hasQuantityDivergence}
                  onCheckedChange={(v) => setHasDiv(v === true)}
                />
                <label htmlFor="hasDiv" className="text-sm">
                  Divergência de Quantidade (NF x Físico)
                </label>
              </div>
              <NumField
                label="Quantidade na NF"
                value={invoiceQuantity}
                onChange={setInvoiceQty}
              />
              <NumField
                label="Quantidade no veículo (físico)"
                value={vehicleQuantity}
                onChange={setVehicleQty}
              />
              <div className="flex items-end gap-2 pb-2">
                <Checkbox
                  id="missingLabel"
                  checked={missingStandardLabel}
                  onCheckedChange={(v) => setMissingLabel(v === true)}
                />
                <label htmlFor="missingLabel" className="text-sm">
                  Falta de Etiqueta Padrão
                </label>
              </div>
              <NumField
                label="Produtos Avariados"
                value={damagedProductsCount}
                onChange={setDamaged}
              />
              <NumField label="Pallets Tombados" value={fallenPalletsCount} onChange={setFallen} />
              <Field label="Divergências de Entrada (descrição)" className="sm:col-span-2">
                <Textarea
                  rows={3}
                  value={entryDivergenceDetails}
                  onChange={(e) => setEntryDiv(e.target.value)}
                />
              </Field>
            </div>
          )}

          <Button className="mt-5 w-full sm:w-auto" onClick={submit}>
            <Save className="mr-2 h-4 w-4" />
            Salvar descarga
          </Button>
        </section>
      </div>
    </AppShell>
  );
}
