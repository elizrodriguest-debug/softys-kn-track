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
