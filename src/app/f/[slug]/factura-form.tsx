"use client";

import { useActionState, useState } from "react";
import { emitirFactura, type EmitirState } from "./actions";
import { desglosarIva } from "@/lib/tax";
import type { OpcionCatalogo } from "@/lib/catalogs";

const initialState: EmitirState = {};

interface Props {
  slug: string;
  color: string;
  tasaIva: number;
  catalogos: {
    regimenFiscal: OpcionCatalogo[];
    usoCfdi: OpcionCatalogo[];
    formaPago: OpcionCatalogo[];
  };
}

const inputCls =
  "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-400";
const labelCls = "block text-sm font-medium text-neutral-700";

const pesos = (n: number) =>
  n.toLocaleString("es-MX", { style: "currency", currency: "MXN" });

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs text-red-600">{msg}</p>;
}

export function FacturaForm({ slug, color, tasaIva, catalogos }: Props) {
  const [state, formAction, pending] = useActionState(emitirFactura, initialState);
  const [totalInput, setTotalInput] = useState("");

  // Pantalla de éxito (#9): resumen + UUID + descargas.
  if (state.ok && state.factura) {
    const f = state.factura;
    return (
      <div className="space-y-4 text-center">
        <div
          className="mx-auto flex h-12 w-12 items-center justify-center rounded-full text-2xl text-white"
          style={{ backgroundColor: color }}
        >
          ✓
        </div>
        <h2 className="text-lg font-semibold text-neutral-800">
          {state.yaExistia ? "Ese folio ya estaba facturado" : "¡Factura timbrada!"}
        </h2>

        <dl className="space-y-1 rounded-md bg-neutral-50 p-3 text-left text-sm">
          <div className="flex justify-between">
            <dt className="text-neutral-500">Receptor</dt>
            <dd className="font-medium text-neutral-800">{f.receptorNombre}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-neutral-500">RFC</dt>
            <dd className="font-mono text-neutral-800">{f.receptorRfc}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-neutral-500">Subtotal</dt>
            <dd className="text-neutral-800">{pesos(f.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-neutral-500">IVA</dt>
            <dd className="text-neutral-800">{pesos(f.iva)}</dd>
          </div>
          <div className="flex justify-between border-t border-neutral-200 pt-1 font-medium">
            <dt className="text-neutral-600">Total</dt>
            <dd className="text-neutral-900">{pesos(f.total)}</dd>
          </div>
        </dl>

        <div className="text-left">
          <p className="text-xs text-neutral-500">Folio fiscal (UUID)</p>
          <p className="break-all rounded-md bg-neutral-100 px-3 py-2 font-mono text-sm text-neutral-800">
            {f.uuid ?? "(sin UUID)"}
          </p>
        </div>

        <div className="flex gap-2">
          <a
            href={`/factura/${f.invoiceId}/pdf`}
            className="flex-1 rounded-md px-4 py-2 text-sm font-medium text-white"
            style={{ backgroundColor: color }}
          >
            Descargar PDF
          </a>
          <a
            href={`/factura/${f.invoiceId}/xml`}
            className="flex-1 rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700"
          >
            Descargar XML
          </a>
        </div>
        <p className="text-xs text-neutral-500">
          También enviaremos tu factura por correo próximamente.
        </p>
      </div>
    );
  }

  const v = state.values ?? {};
  const fe = state.fieldErrors ?? {};

  // Preview de desglose en vivo (#9), derivado de `tax` sobre el total capturado.
  const totalNum = Number(totalInput || v.total || "0");
  const preview =
    Number.isFinite(totalNum) && totalNum > 0 ? desglosarIva(totalNum, tasaIva) : null;

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="slug" value={slug} />

      {state.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
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
          <select id="usoCfdi" name="usoCfdi" className={inputCls} defaultValue={v.usoCfdi ?? ""}>
            <option value="" disabled>Selecciona…</option>
            {catalogos.usoCfdi.map((o) => (
              <option key={o.clave} value={o.clave}>{o.clave} · {o.descripcion}</option>
            ))}
          </select>
          <FieldError msg={fe.usoCfdi} />
        </div>
        <div>
          <label className={labelCls} htmlFor="formaPago">Forma de pago</label>
          <select id="formaPago" name="formaPago" className={inputCls} defaultValue={v.formaPago ?? ""}>
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

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={labelCls} htmlFor="folioTicket">Folio del ticket</label>
          <input id="folioTicket" name="folioTicket" className={inputCls}
            defaultValue={v.folioTicket} placeholder="A-12345" />
          <FieldError msg={fe.folioTicket} />
        </div>
        <div>
          <label className={labelCls} htmlFor="fechaTicket">Fecha del ticket</label>
          <input id="fechaTicket" name="fechaTicket" type="date" className={inputCls}
            defaultValue={v.fechaTicket} />
          <FieldError msg={fe.fechaTicket} />
        </div>
        <div>
          <label className={labelCls} htmlFor="total">Total (con IVA)</label>
          <input id="total" name="total" className={inputCls}
            defaultValue={v.total} inputMode="decimal" placeholder="116.00"
            onChange={(e) => setTotalInput(e.target.value)} />
          <FieldError msg={fe.total} />
        </div>
      </div>

      {preview && (
        <dl className="space-y-1 rounded-md bg-neutral-50 p-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-neutral-500">Subtotal</dt>
            <dd className="text-neutral-800">{pesos(preview.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-neutral-500">IVA ({Math.round(tasaIva * 100)}%)</dt>
            <dd className="text-neutral-800">{pesos(preview.iva)}</dd>
          </div>
          <div className="flex justify-between border-t border-neutral-200 pt-1 font-medium">
            <dt className="text-neutral-600">Total</dt>
            <dd className="text-neutral-900">{pesos(preview.total)}</dd>
          </div>
        </dl>
      )}

      <button type="submit" disabled={pending}
        className="w-full rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        style={{ backgroundColor: color }}>
        {pending ? "Timbrando…" : "Generar factura"}
      </button>
    </form>
  );
}
