"use client";

import { useMemo, useState, useTransition } from "react";
import { registrarVenta, type TicketResumen } from "./actions";

interface Item {
  tipo: "receta" | "producto";
  id: string;
  codigo: string;
  nombre: string;
  categoria: string;
  precios: Record<string, string>; // canalId → precio (con IVA)
}
interface Opt { id: string; nombre: string }
interface Props {
  tiendas: { id: string; codigo: string; nombre: string }[];
  canales: Opt[];
  medios: Opt[];
  items: Item[];
}

const mxn = (n: number) => n.toLocaleString("es-MX", { style: "currency", currency: "MXN" });

export function PosClient({ tiendas, canales, medios, items }: Props) {
  const [tiendaId, setTiendaId] = useState(tiendas[0]?.id ?? "");
  const [canalId, setCanalId] = useState(canales[0]?.id ?? "");
  const [medioPagoId, setMedioPagoId] = useState(medios[0]?.id ?? "");
  const [modo, setModo] = useState<"VENTA" | "DEVOLUCION">("VENTA");
  const [cat, setCat] = useState<string>("Todas");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [ticket, setTicket] = useState<TicketResumen | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const categorias = useMemo(() => ["Todas", ...Array.from(new Set(items.map((i) => i.categoria)))], [items]);
  const visibles = items.filter((i) => cat === "Todas" || i.categoria === cat);
  const byKey = useMemo(() => new Map(items.map((i) => [`${i.tipo}:${i.id}`, i])), [items]);

  const precioDe = (it: Item) => Number(it.precios[canalId] ?? "0");
  const total = Object.entries(cart).reduce((t, [key, qty]) => {
    const it = byKey.get(key);
    return it ? t + precioDe(it) * qty : t;
  }, 0);

  const add = (it: Item) => setCart((c) => ({ ...c, [`${it.tipo}:${it.id}`]: (c[`${it.tipo}:${it.id}`] ?? 0) + 1 }));
  const setQty = (key: string, qty: number) =>
    setCart((c) => {
      const next = { ...c };
      if (qty <= 0) delete next[key];
      else next[key] = qty;
      return next;
    });

  const cobrar = () => {
    setError(null);
    const lineas = Object.entries(cart).map(([key, qty]) => {
      const it = byKey.get(key)!;
      return { tipo: it.tipo, id: it.id, qty };
    });
    if (!lineas.length) return;
    startTransition(async () => {
      const res = await registrarVenta({ tiendaId, canalId, medioPagoId: medioPagoId || undefined, modo, lineas });
      if (res.ok && res.ticket) {
        setTicket(res.ticket);
        setCart({});
      } else {
        setError(res.error ?? "Error al cobrar.");
      }
    });
  };

  // Pantalla de ticket (imprimible). Los botones se ocultan al imprimir.
  if (ticket) {
    return (
      <div className="mx-auto max-w-sm">
        <div className="rounded-xl border border-neutral-200 bg-white p-6 font-mono text-sm">
          <p className="text-center text-base font-semibold">ERP YOU</p>
          <p className="text-center text-neutral-500">{ticket.modo === "DEVOLUCION" ? "DEVOLUCIÓN" : "Ticket de venta"}</p>
          <p className="mt-2 text-center text-lg font-bold">{ticket.folio}</p>
          <p className="text-center text-xs text-neutral-400">{ticket.canal} · {new Date(ticket.fecha).toLocaleString("es-MX")}</p>
          <hr className="my-3" />
          {ticket.lineas.map((l, k) => (
            <div key={k} className="flex justify-between">
              <span>{l.qty} × {l.articulo}</span>
              <span>{mxn(Number(l.totalVenta))}</span>
            </div>
          ))}
          <hr className="my-3" />
          <div className="flex justify-between text-neutral-500"><span>Subtotal</span><span>{mxn(Number(ticket.subtotalSinIva))}</span></div>
          <div className="flex justify-between text-neutral-500"><span>IVA</span><span>{mxn(Number(ticket.iva))}</span></div>
          {Number(ticket.comisionMonto) !== 0 && (
            <div className="flex justify-between text-neutral-500"><span>Comisión</span><span>{mxn(Number(ticket.comisionMonto))}</span></div>
          )}
          <div className="mt-1 flex justify-between text-base font-bold"><span>Total</span><span>{mxn(Number(ticket.total))}</span></div>
        </div>
        <div className="mt-4 flex gap-3 print:hidden">
          <button onClick={() => window.print()} className="flex-1 rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-100">Imprimir</button>
          <button onClick={() => { setTicket(null); setError(null); }} className="flex-1 rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800">Nueva operación</button>
        </div>
      </div>
    );
  }

  const selectCls = "rounded-md border border-neutral-300 px-2 py-1.5 text-sm";

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_22rem]">
      <div>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {tiendas.length > 1 && (
            <select value={tiendaId} onChange={(e) => setTiendaId(e.target.value)} className={selectCls}>
              {tiendas.map((t) => (<option key={t.id} value={t.id}>{t.codigo}</option>))}
            </select>
          )}
          <select value={canalId} onChange={(e) => setCanalId(e.target.value)} className={selectCls}>
            {canales.map((c) => (<option key={c.id} value={c.id}>{c.nombre}</option>))}
          </select>
          <select value={medioPagoId} onChange={(e) => setMedioPagoId(e.target.value)} className={selectCls}>
            <option value="">Sin medio</option>
            {medios.map((m) => (<option key={m.id} value={m.id}>{m.nombre}</option>))}
          </select>
          <select value={modo} onChange={(e) => setModo(e.target.value as "VENTA" | "DEVOLUCION")} className={selectCls}>
            <option value="VENTA">Venta</option>
            <option value="DEVOLUCION">Devolución</option>
          </select>
        </div>

        <div className="mb-3 flex flex-wrap gap-2">
          {categorias.map((c) => (
            <button key={c} onClick={() => setCat(c)} className={`rounded-full px-3 py-1 text-sm ${cat === c ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-700"}`}>{c}</button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {visibles.map((it) => {
            const precio = precioDe(it);
            return (
              <button
                key={`${it.tipo}:${it.id}`}
                onClick={() => add(it)}
                disabled={precio <= 0}
                className="flex h-24 flex-col justify-between rounded-xl border border-neutral-200 bg-white p-3 text-left hover:border-neutral-400 disabled:opacity-50"
              >
                <span className="text-sm font-medium text-neutral-800">{it.nombre}</span>
                <span className="text-sm text-neutral-500">{precio > 0 ? mxn(precio) : "sin precio"}</span>
              </button>
            );
          })}
          {visibles.length === 0 && <p className="text-sm text-neutral-400">Sin artículos. Captura recetas/productos y precios.</p>}
        </div>
      </div>

      <aside className="rounded-xl border border-neutral-200 bg-white p-4">
        <h2 className="text-sm font-medium text-neutral-800">Carrito {modo === "DEVOLUCION" && <span className="text-amber-600">(devolución)</span>}</h2>
        <div className="mt-2 space-y-2">
          {Object.entries(cart).length === 0 && <p className="text-sm text-neutral-400">Toca un artículo para agregarlo.</p>}
          {Object.entries(cart).map(([key, qty]) => {
            const it = byKey.get(key)!;
            return (
              <div key={key} className="flex items-center justify-between gap-2 text-sm">
                <span className="flex-1 text-neutral-800">{it.nombre}</span>
                <button onClick={() => setQty(key, qty - 1)} className="h-6 w-6 rounded bg-neutral-100">−</button>
                <span className="w-6 text-center">{qty}</span>
                <button onClick={() => setQty(key, qty + 1)} className="h-6 w-6 rounded bg-neutral-100">+</button>
                <span className="w-20 text-right text-neutral-700">{mxn(precioDe(it) * qty)}</span>
              </div>
            );
          })}
        </div>
        <div className="mt-4 border-t border-neutral-200 pt-3">
          <div className="flex items-end justify-between">
            <span className="text-sm text-neutral-500">Total</span>
            <span className="text-3xl font-bold text-neutral-900">{mxn(total)}</span>
          </div>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          <button
            onClick={cobrar}
            disabled={pending || total === 0}
            className="mt-3 w-full rounded-md bg-neutral-900 py-3 text-base font-semibold text-white hover:bg-neutral-800 disabled:opacity-50"
          >
            {pending ? "Procesando…" : modo === "DEVOLUCION" ? "Registrar devolución" : "Cobrar"}
          </button>
        </div>
      </aside>
    </div>
  );
}
