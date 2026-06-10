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
- [x] Modelo `Emisor` extendido con config: regimenFiscal, cpExpedicion, conceptoDefault (claveProdServ, claveUnidad, descripción, tasaIva), ventanaFacturacion (default: mismo mes), facturamaIssuerRef.
- [x] `facturama-client` con auth Basic y métodos `uploadCsd`/`createIssuer` contra sandbox. *(En Multiemisor el emisor se da de alta implícitamente al cargar su CSD por RFC: `POST api-lite/csds`; no hay endpoint `createIssuer` separado. El cliente expone `uploadCsd`, `listCsds`, `getCsd`, `removeCsd`.)*
- [x] CLI que recibe CSD (.cer/.key/pass) + datos del emisor, sube el CSD a Facturama sandbox y persiste el `Emisor`.
- [x] Credenciales de Facturama leídas de variables de entorno (nunca en código).
- [x] **Tests de contrato** de `facturama-client` con HTTP mockeado: header de auth correcto, request de carga de CSD bien formado, parseo de respuesta y manejo de error.
- [ ] Verificación manual (HITL): correr el CLI con un CSD de prueba deja el CSD cargado en sandbox y el emisor en BD. **← PENDIENTE: requiere credenciales de la cuenta sandbox de Facturama + un CSD de prueba.**

## Estado
Código **COMPLETADO** (2026-06-10): 5/6 criterios. Solo falta la verificación manual
contra el sandbox real, que requiere intervención humana (credenciales + CSD).
Cómo correrlo cuando estén las credenciales:
```
# en .env: FACTURAMA_USER, FACTURAMA_PASSWORD, FACTURAMA_ENV=sandbox
npm run emisor:alta -- --slug demo --rfc EKU9003173C9 \
  --razon-social "Panadería Demo SA de CV" --regimen 601 --cp-expedicion 64000 \
  --cer ./csd/demo.cer --key ./csd/demo.key --key-pass <pass> \
  --clave-prodserv 90111501 --clave-unidad E48 --descripcion "Consumo de alimentos" \
  --tasa-iva 0.16 --nombre-comercial "Panadería Demo" --color "#b45309"
```

## Blocked by
- #1 · [Esqueleto + resolución de tenant](01-esqueleto-tenant.md)
