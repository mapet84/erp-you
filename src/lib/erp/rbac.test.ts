import { describe, it, expect } from "vitest";
import {
  can,
  puedeEnTienda,
  rolEnModulo,
  modulosVisibles,
  MODULOS,
  type AuthzUser,
  type Rol,
  type Accion,
} from "./rbac";

function user(partial: Partial<AuthzUser>): AuthzUser {
  return { esAdmin: false, roles: [], tiendas: [], ...partial };
}

describe("matriz rol × acción (sin restricción de tienda)", () => {
  const casos: Array<[Rol, Accion, boolean]> = [
    ["LECTOR", "read", true],
    ["LECTOR", "write", false],
    ["LECTOR", "configure", false],
    ["OPERATIVO", "read", true],
    ["OPERATIVO", "write", true],
    ["OPERATIVO", "configure", false],
    ["CONFIGURADOR", "read", true],
    ["CONFIGURADOR", "write", true],
    ["CONFIGURADOR", "configure", true],
  ];
  it.each(casos)("%s puede %s = %s en su módulo", (rol, accion, esperado) => {
    const u = user({ roles: [{ modulo: "POS", rol }] });
    expect(can(u, "POS", accion)).toBe(esperado);
  });
});

describe("acceso por módulo", () => {
  it("sin rol en el módulo = deny en cualquier acción", () => {
    const u = user({ roles: [{ modulo: "POS", rol: "CONFIGURADOR" }] });
    expect(can(u, "FINANZAS", "read")).toBe(false);
    expect(can(u, "FINANZAS", "write")).toBe(false);
  });

  it("los roles son independientes por módulo", () => {
    const u = user({
      roles: [
        { modulo: "POS", rol: "OPERATIVO" },
        { modulo: "FINANZAS", rol: "LECTOR" },
      ],
    });
    expect(can(u, "POS", "write")).toBe(true);
    expect(can(u, "FINANZAS", "write")).toBe(false);
    expect(can(u, "FINANZAS", "read")).toBe(true);
    expect(rolEnModulo(u, "GESTION")).toBeNull();
  });
});

describe("alcance por tienda", () => {
  it("OPERATIVO solo en sus tiendas asignadas", () => {
    const u = user({ roles: [{ modulo: "POS", rol: "OPERATIVO" }], tiendas: ["t1"] });
    expect(can(u, "POS", "write", "t1")).toBe(true);
    expect(can(u, "POS", "write", "t2")).toBe(false);
  });

  it("OPERATIVO/LECTOR sin tiendas no puede sobre ninguna tienda", () => {
    const u = user({ roles: [{ modulo: "POS", rol: "OPERATIVO" }], tiendas: [] });
    expect(can(u, "POS", "write", "t1")).toBe(false);
    // …pero una acción no ligada a tienda sí (no aplica el filtro).
    expect(can(u, "POS", "write")).toBe(true);
  });

  it("CONFIGURADOR sin tiendas = todas; con tiendas = solo esas", () => {
    const todas = user({ roles: [{ modulo: "GESTION", rol: "CONFIGURADOR" }], tiendas: [] });
    expect(can(todas, "GESTION", "configure", "cualquiera")).toBe(true);

    const acotado = user({
      roles: [{ modulo: "GESTION", rol: "CONFIGURADOR" }],
      tiendas: ["t1"],
    });
    expect(can(acotado, "GESTION", "configure", "t1")).toBe(true);
    expect(can(acotado, "GESTION", "configure", "t2")).toBe(false);
  });

  it("puedeEnTienda sin rol en el módulo = false", () => {
    const u = user({ roles: [], tiendas: ["t1"] });
    expect(puedeEnTienda(u, "POS", "t1")).toBe(false);
  });
});

describe("admin (super-usuario)", () => {
  const admin = user({ esAdmin: true });
  it("puede todo, en todo módulo y tienda", () => {
    expect(can(admin, "FINANZAS", "configure")).toBe(true);
    expect(can(admin, "POS", "write", "cualquier-tienda")).toBe(true);
    expect(puedeEnTienda(admin, "GESTION", "t99")).toBe(true);
    expect(modulosVisibles(admin)).toEqual([...MODULOS]);
  });
});

describe("modulosVisibles", () => {
  it("devuelve solo los módulos legibles, en orden", () => {
    const u = user({
      roles: [
        { modulo: "FINANZAS", rol: "LECTOR" },
        { modulo: "POS", rol: "OPERATIVO" },
      ],
    });
    expect(modulosVisibles(u)).toEqual(["POS", "FINANZAS"]);
  });

  it("usuario sin roles no ve módulos", () => {
    expect(modulosVisibles(user({}))).toEqual([]);
  });
});
