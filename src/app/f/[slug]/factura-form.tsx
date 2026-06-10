"use client";

import { useActionState } from "react";
import { emitirFactura, type EmitirState } from "./actions";
import type { OpcionCatalogo } from "@/lib/catalogs";

const initialState: EmitirState = {};

interface Props {
  slug: string;
  color: string;
  catalogos: {
    regimenFiscal: OpcionCatalogo[];
    usoCfdi: OpcionCatalogo[];
    formaPago: OpcionCatalogo[];
  };
}

const inputCls =
  "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-400";
const labelCls = "block text-sm font-medium text-neutral-700";

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs text-red-600">{msg}</p>;
}

export function FacturaForm({ slug, color, catalogos }: Props) {
  const [state, formAction, pending] = useActionState(emitirFactura, initialState);

  // Pantalla de éxito: muestra el folio fiscal (UUID).
  if (state.ok) {
    return (
      <div className="space-y-3 text-center">
        <div
          className="mx-auto flex h-12 w-12 items-center justify-center rounded-full text-2xl text-white"
          style={{ backgroundColor: color }}
        >
          ✓
        </div>
        <h2 className="text-lg font-semibold text-neutral-800">
          {state.yaExistia ? "Ese folio ya estaba facturado" : "¡Factura timbrada!"}
        </h2>
        <p className="text-sm text-neutral-600">Folio fiscal (UUID):</p>
        <p className="break-all rounded-md bg-neutral-100 px-3 py-2 font-mono text-sm text-neutral-800">
          {state.uuid ?? "(sin UUID)"}
        </p>
        <p className="text-xs text-neutral-500">
          La descarga del PDF y XML estará disponible próximamente.
        </p>
      </div>
    );
  }

  const v = state.values ?? {};
  const fe = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="slug" value={slug} />

      {state.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div>
        <label className={labelCls} htmlFor="rfc">RFC</label>
        <input id="rfc" name="rfc" className={inputCls} defaultValue={v.rfc}
          placeholder="XAXX010101000" autoCapitalize="characters" />
        <FieldError msg={fe.rfc} />
      </div>

      <div>
        <label className={labelCls} htmlFor="nombre">Nombre / Razón social</label>
        <input id="nombre" name="nombre" className={inputCls} defaultValue={v.nombre} />
        <FieldError msg={fe.nombre} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls} htmlFor="cp">Código postal</label>
          <input id="cp" name="cp" className={inputCls} defaultValue={v.cp}
            inputMode="numeric" placeholder="64000" />
          <FieldError msg={fe.cp} />
        </div>
        <div>
          <label className={labelCls} htmlFor="regimenFiscal">Régimen fiscal</label>
          <select id="regimenFiscal" name="regimenFiscal" className={inputCls}
            defaultValue={v.regimenFiscal ?? ""}>
            <option value="" disabled>Selecciona…</option>
            {catalogos.regimenFiscal.map((o) => (
              <option key={o.clave} value={o.clave}>{o.clave} · {o.descripcion}</option>
            ))}
          </select>
          <FieldError msg={fe.regimenFiscal} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls} htmlFor="usoCfdi">Uso del CFDI</label>
          <select id="usoCfdi" name="usoCfdi" className={inputCls}
            defaultValue={v.usoCfdi ?? ""}>
            <option value="" disabled>Selecciona…</option>
            {catalogos.usoCfdi.map((o) => (
              <option key={o.clave} value={o.clave}>{o.clave} · {o.descripcion}</option>
            ))}
          </select>
          <FieldError msg={fe.usoCfdi} />
        </div>
        <div>
          <label className={labelCls} htmlFor="formaPago">Forma de pago</label>
          <select id="formaPago" name="formaPago" className={inputCls}
            defaultValue={v.formaPago ?? ""}>
            <option value="" disabled>Selecciona…</option>
            {catalogos.formaPago.map((o) => (
              <option key={o.clave} value={o.clave}>{o.clave} · {o.descripcion}</option>
            ))}
          </select>
          <FieldError msg={fe.formaPago} />
        </div>
      </div>

      <div>
        <label className={labelCls} htmlFor="email">Correo electrónico</label>
        <input id="email" name="email" type="email" className={inputCls}
          defaultValue={v.email} placeholder="tu@correo.com" />
        <FieldError msg={fe.email} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls} htmlFor="folioTicket">Folio del ticket</label>
          <input id="folioTicket" name="folioTicket" className={inputCls}
            defaultValue={v.folioTicket} placeholder="A-12345" />
          <FieldError msg={fe.folioTicket} />
        </div>
        <div>
          <label className={labelCls} htmlFor="total">Total (con IVA)</label>
          <input id="total" name="total" className={inputCls} defaultValue={v.total}
            inputMode="decimal" placeholder="116.00" />
          <FieldError msg={fe.total} />
        </div>
      </div>

      <button type="submit" disabled={pending}
        className="w-full rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        style={{ backgroundColor: color }}>
        {pending ? "Timbrando…" : "Generar factura"}
      </button>
    </form>
  );
}
