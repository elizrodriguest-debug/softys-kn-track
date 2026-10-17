import { describe, expect, it } from "vitest";
import { consolidate, productivity } from "./resources";

describe("produtividade", () => {
  it("horária = volume / recursos reais", () => {
    expect(productivity(400, 4)).toBe(100);
    expect(productivity(270, 3)).toBe(90);
  });

  it("turno = volume total / recursos-hora (não média simples)", () => {
    const r = consolidate([
      { volume: 400, actual: 4, planned: 4 },
      { volume: 300, actual: 3, planned: 4 },
      { volume: 500, actual: 5, planned: 4 },
    ]);
    expect(r.volume).toBe(1200);
    expect(r.resourceHours).toBe(12);
    expect(r.productivity).toBe(100);
  });

  it("usa recursos reais, não planejados, e calcula aderência real/planejado", () => {
    const r = consolidate([
      { volume: 300, actual: 3, planned: 4 },
      { volume: 100, actual: 1, planned: 4 },
    ]);
    expect(r.productivity).toBe(100);
    expect(r.adherence).toBe(0.5);
  });
});

import { operationalDate, shiftFromTime } from "./types";
describe("dia operacional", () => {
  it("T3 após meia-noite pertence ao dia anterior", () => {
    expect(operationalDate("2026-10-02", "02:30", "T3")).toBe("2026-10-01");
  });
  it("T3 antes da meia-noite fica no mesmo dia", () => {
    expect(operationalDate("2026-10-01", "23:00", "T3")).toBe("2026-10-01");
  });
  it("T3 do último dia do mês não vai para o mês seguinte", () => {
    expect(operationalDate("2026-11-01", "04:00", "T3")).toBe("2026-10-31");
  });
  it("turnos 06/14/22", () => {
    expect(shiftFromTime("06:00")).toBe("T1");
    expect(shiftFromTime("14:00")).toBe("T2");
    expect(shiftFromTime("22:00")).toBe("T3");
    expect(shiftFromTime("05:59")).toBe("T3");
  });
});
