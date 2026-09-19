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
├── composables/                # useCheckout.ts, useQrPayment.ts, useScrollLock.ts (lógica con cleanup)
├── lib/                        # api.ts (cliente tipado), config.ts, constants.ts, format.ts, types.ts
├── styles/                     # global.css (design system), about.css, legal.css
└── pages/                      # index, nosotros, privacidad, condiciones, 404
```

El sistema de diseño vive en `src/styles/global.css`: tokens de color, radios, sombras con tinte teal,
escala tipográfica, esqueletos de carga, foco visible y `prefers-reduced-motion`. Las animaciones de
entrada por scroll usan `animation-timeline: view()` (CSS puro, sin JS) y se degradan solas donde no hay
soporte.

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

## Panel de administración

Rutas privadas bajo `/admin`, con layout propio (sidebar, sin header/footer de tienda) y `noindex`:

| Ruta                 | Contenido                                                        |
| :------------------- | :--------------------------------------------------------------- |
| `/admin/login`       | Login JWT (`POST /auth/login`)                                   |
| `/admin`             | Resumen: productos, stock bajo, categorías y ventas del día      |
| `/admin/productos`   | CRUD de productos, filtros, stock y subida de imágenes (multipart) |
| `/admin/categorias`  | CRUD de categorías con edición en línea                          |
| `/admin/ventas`      | Listado, detalle expandible y anulación (restaura stock)         |

Detalles de implementación:

- `src/stores/session.ts` guarda `token` + usuario en `localStorage` (`serena:session:v1`) y se hidrata
  al montar; `src/composables/useAdminGuard.ts` redirige a `/admin/login?redirect=...` cuando no hay
  sesión y ante un `401` (el cliente limpia la sesión en `lib/admin-api.ts`).
- Las islas del panel usan `client:load` y renderizan solo cuando el guard confirma la sesión.
- La API admin vive en `src/lib/admin-api.ts` (añade `Authorization: Bearer`, normaliza los `numeric`
  que Postgres devuelve como string y sube imágenes con `FormData`).
- El guard es de cliente: es una barrera de UX, no de seguridad. La autorización real depende del
  backend (hoy sin RBAC; ver pendientes).
- Las acciones destructivas (eliminar producto/categoría, anular venta) se confirman en línea con
  `AdminConfirm.vue`, sin `window.confirm`. Las tablas muestran esqueletos mientras cargan y el modal
  de producto bloquea el scroll del fondo con `useScrollLock`.

Para probar el panel hace falta un usuario. Si la base no tiene ninguno, se puede crear con
`POST /usuarios` + `POST /roles` (endpoints abiertos en el backend actual) o desde el módulo de
usuarios una vez se restrinja el acceso.

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
6. `npm run build && node serve.cjs` → `/`, `/nosotros`, `/privacidad`, `/condiciones` responden 200 y una
   ruta inexistente responde 404 con la página de marca.
7. Navegación por teclado: `Tab` desde el inicio muestra el enlace "Saltar al contenido"; los botones y
   enlaces muestran anillo de foco; los overlays (drawer, modales) bloquean el scroll del fondo.
8. Entrar a `/admin` sin sesión → redirige a `/admin/login`. Iniciar sesión → vuelve a la ruta pedida.
9. En el panel: crear/editar/eliminar un producto (con al menos una imagen), crear una categoría y
   anular una venta; recargar → los cambios persisten y el catálogo público refleja stock/precio.
10. Eliminar o anular pide confirmación en la misma fila (sin diálogos nativos); `Tab` muestra el
    enlace "Saltar al contenido" y los anillos de foco también sobre el sidebar oscuro.

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

## Pendientes conocidos

- **WhatsApp/contacto:** conviven dos números distintos (`wa.me/59170000000` para pedidos y
  `wa.me/573001234567` en footer/legales) y el texto `+591 57911147`. Falta definir el número real y
  unificarlo (hoy centralizado en `src/lib/constants.ts`).
- **Pagos simulados en backend:** el QR se aprueba automáticamente a los ~8 s; aunque el cliente cierre
  el modal, la venta puede registrarse en el servidor. El frontend detiene su polling al cerrar.
- **Cuenta de cliente:** el panel administrativo ya usa `POST /auth/login`, pero la tienda pública sigue
  sin cuenta de usuario ni historial de pedidos (el backend no filtra `GET /ventas` por usuario).
- **Administración pendiente:** gestión de usuarios y roles dentro del panel; hoy solo hay productos,
  categorías y ventas.
- **Backend:** `synchronize: true`, CORS abierto y controllers de usuarios/roles sin guard (ver README
  del backend). El guard del panel es de cliente: cualquier usuario autenticado puede administrar.
