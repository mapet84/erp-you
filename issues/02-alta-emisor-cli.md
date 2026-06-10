# 2 · Alta de emisor por CLI + `facturama-client` (auth + CSD)

**Tipo:** HITL — requiere credenciales de la cuenta sandbox de Facturama y un CSD de prueba.

## Parent
PRD: [`../PRD.md`](../PRD.md) — ERP YOU · Fase 1: Portal de Autofacturación CFDI 4.0

## What to build
El alta de un emisor sin panel admin, vía un script/CLI, y la base del adaptador
`facturama-client`. El CLI toma los archivos del CSD (.cer, .key, contraseña) y la config del
emisor, sube el CSD a Facturama **Multiemisor (sandbox)** y crea/actualiza el registro `Emisor`
en la BD con toda su configuración fiscal y de marca.

El adaptador `facturama-client` encapsula la API Multiemisor: construcción del header de auth
Basic, `uploadCsd`/`createIssuer`, y el switch sandbox/producción por variable de entorno.
Las llaves privadas NO se almacenan en nuestra BD: viven en Facturama.

## Acceptance criteria
- [ ] Modelo `Emisor` extendido con config: regimenFiscal, cpExpedicion, conceptoDefault (claveProdServ, claveUnidad, descripción, tasaIva), ventanaFacturacion (default: mismo mes), facturamaIssuerRef.
- [ ] `facturama-client` con auth Basic y métodos `uploadCsd`/`createIssuer` contra sandbox.
- [ ] CLI que recibe CSD (.cer/.key/pass) + datos del emisor, sube el CSD a Facturama sandbox y persiste el `Emisor`.
- [ ] Credenciales de Facturama leídas de variables de entorno (nunca en código).
- [ ] **Tests de contrato** de `facturama-client` con HTTP mockeado: header de auth correcto, request de carga de CSD bien formado, parseo de respuesta y manejo de error.
- [ ] Verificación manual (HITL): correr el CLI con un CSD de prueba deja el CSD cargado en sandbox y el emisor en BD.

## Blocked by
- #1 · [Esqueleto + resolución de tenant](01-esqueleto-tenant.md)
