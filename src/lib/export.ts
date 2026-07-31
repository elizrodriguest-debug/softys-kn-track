export function exportCSV(filename: string, rows: Record<string, string | number>[]) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]!);
  const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const csv = [
    headers.join(";"),
    ...rows.map((r) => headers.map((h) => escape(r[h] ?? "")).join(";")),
  ].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportPDF() {
  window.print();
}
