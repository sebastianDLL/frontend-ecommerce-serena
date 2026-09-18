# SERENA — Frontend Ecommerce

Sitio de tienda para **SERENA**, velas aromáticas artesanales. Frontend estático generado con
[Astro](https://astro.build) y componentes interactivos en Vue 3 (islas), conectado a la API NestJS de
`backend-ecommerce-negocios`.

## Requisitos

- Node.js >= 22.12

## Puesta en marcha

```bash
npm install
cp .env.example .env   # en Windows: Copy-Item .env.example .env
npm run dev
```

El sitio queda disponible en `http://localhost:4321` y la API se configura con `PUBLIC_API_URL`.

## Scripts

| Comando                 | Acción                                                       |
| :---------------------- | :----------------------------------------------------------- |
| `npm run dev`           | Servidor de desarrollo en `localhost:4321`                   |
| `npm run build`         | Build estático en `dist/` (falla si falta `PUBLIC_API_URL`)  |
| `npm run preview`       | Vista previa del build                                       |
| `npm run check`         | Diagnóstico de tipos de Astro/Vue/TS                         |
| `npm run lint`          | ESLint sobre todo el proyecto                                |
| `npm run format`        | Formatea `src/`, configs y scripts con Prettier              |
| `npm run format:check`  | Verifica formato sin escribir                                |
| `node serve.cjs`        | Sirve `dist/` en `127.0.0.1:4321` para pruebas locales       |

## Arquitectura

Principio: **HTML estático para todo lo que no necesita estado; islas Vue solo donde hay interacción.**
El contenido no interactivo (hero, pilares, statement, header, footer, páginas legales) se renderiza en
build, sin JavaScript. El catálogo y el carrito son dos islas que comparten un store de módulo.

```
src/
├── layouts/
│   ├── Layout.astro            # <head> y SEO por props (title, description, ogImage, robots…)
│   └── SiteLayout.astro        # AnnouncementBar + SiteHeader + <main> + SiteFooter
├── components/
│   ├── ui/                     # AnnouncementBar, SiteHeader, SiteFooter (Astro, 0 JS)
│   ├── home/                   # Hero, Pillars, Statement (Astro, 0 JS)
│   ├── catalog/                # Catalog.vue + ProductDetailModal.vue  (isla client:visible)
│   └── cart/                   # CartWidget.vue + CartDrawer, CheckoutModal, SuccessModal, Toast
├── stores/                     # cart.ts, catalog.ts, toast.ts (estado reactivo compartido)
├── composables/                # useCheckout.ts, useQrPayment.ts (lógica con cleanup)
├── lib/                        # api.ts (cliente tipado), config.ts, constants.ts, format.ts, types.ts
├── styles/                     # global.css (design system), about.css, legal.css
└── pages/                      # index, nosotros, privacidad, condiciones
```

### Islas y estado compartido

- `CartWidget` (`client:idle`) se monta en el header: botón, badge, drawer, checkout, QR, modal de
  éxito y toast. Renderiza sus overlays con `<Teleport to="body">` para escapar del `backdrop-filter`
  del header sticky y evitar saltos de hidratación.
- `Catalog` (`client:visible`) monta búsqueda, filtros, grid y modal de detalle.
- Ambas islas importan los mismos módulos (`stores/cart.ts`), que Vite comparte en un chunk común: el
  carrito es una única fuente de verdad aunque existan dos aplicaciones Vue en la página.

### Capa de datos

- `lib/api.ts` concentra los `fetch` con timeout, `AbortController` y errores normalizados (`ApiError`).
- `stores/cart.ts` persiste en `localStorage` (se hidrata recién al montar, para no romper la
  hidratación SSR) y limita las cantidades al stock disponible.
- `composables/useQrPayment.ts` controla el polling del pago QR (2 s) y garantiza la limpieza del
  intervalo al cerrar, cancelar o desmontar. `useCheckout.ts` valida el formulario y arma el payload.

### Endpoints consumidos

| Acción             | Endpoint                       |
| :----------------- | :----------------------------- |
| Catálogo            | `GET /productos/stock`         |
| Venta (transferencia) | `POST /ventas`               |
| Generar QR          | `POST /pagos/qr/generar`       |
| Verificar QR (polling) | `GET /pagos/qr/:codigo/verificar` |

El backend sirve imágenes en `/uploads/...`; `lib/format.ts` resuelve la URL absoluta a partir de
`PUBLIC_API_URL`.

## Variables de entorno

| Variable           | Tipo    | Descripción                                                                 |
| :----------------- | :------ | :-------------------------------------------------------------------------- |
| `PUBLIC_API_URL`   | string  | URL base de la API con prefijo de versión (ej. `http://localhost:3000/api/v1`). Requerida. |
| `PUBLIC_DEMO_MODE` | boolean | Muestra catálogo/pedidos de ejemplo si la API no responde. Por defecto `false`; en `astro dev` se activa solo. |

El esquema se valida en `astro.config.mjs` (`envField`): un build sin `PUBLIC_API_URL` falla de forma
explícita en lugar de publicar URLs a `localhost`.

## QA manual sugerido

1. `npm run dev` con backend apagado → el catálogo muestra la colección demo (modo dev) con aviso.
2. Agregar producto, abrir carrito, cambiar cantidades, recargar la página → el carrito persiste.
3. Checkout por transferencia (modo demo) → código `SERENA-XXXX` y modal de éxito.
4. Checkout por QR → panel con polling; cerrar el modal detiene el polling; "Cancelar y volver" lo reinicia.
5. Navegar a colecciones desde el footer (`/?categoria=...#coleccion`) → el filtro se aplica y la URL
   se limpia.
6. `npm run build && node serve.cjs` → `/`, `/nosotros`, `/privacidad`, `/condiciones` responden 200.

## Solución de problemas

**El catálogo queda en "Preparando la colección..." y la consola muestra
`__VUE_HMR_RUNTIME__ is not defined`.**

Ocurre si se ejecuta `npm run build` mientras el dev server está corriendo: el build regenera
`node_modules/.vite/deps` en modo producción y el dev server sirve un bundle de Vue sin el runtime de
HMR, por lo que las islas no hidratan. Recuperación:

```bash
astro dev stop
rm -rf node_modules/.vite   # Windows: Remove-Item -Recurse -Force node_modules\.vite
npm run dev
```

Regla práctica: nunca correr `npm run build` con el dev server activo; deténlo primero.

## Pendientes conocidos (fuera del alcance del refactor)

- **WhatsApp/contacto:** conviven dos números distintos (`wa.me/59170000000` para pedidos y
  `wa.me/573001234567` en footer/legales) y el texto `+591 57911147`. Falta definir el número real y
  unificarlo (hoy centralizado en `src/lib/constants.ts`).
- **Pagos simulados en backend:** el QR se aprueba automáticamente a los ~8 s; aunque el cliente cierre
  el modal, la venta puede registrarse en el servidor. El frontend detiene su polling al cerrar.
- **Autenticación/panel:** el backend expone login JWT, usuarios y roles, pero el frontend público aún
  no tiene cuenta de usuario ni panel administrativo.
- **Backend:** `synchronize: true`, CORS abierto y controllers de usuarios/roles sin guard (ver README
  del backend).
