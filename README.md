# TechRevent - Frontend

Frontend en Vue 3 (JavaScript, `<script setup>`) para TechRevent. Usa Vite, CoreUI para Vue (tokens `--revent-*`), Pinia (con `pinia-plugin-persistedstate`), Vue Router, Axios, SweetAlert2 y dayjs. La estructura de trabajo sigue la de `thuman-frontend` (models, services, stores, controllers, templates); la lógica y el aspecto son los de Kanri/CoreUI.

## Instalación y comandos

```bash
npm install
cp .env.example .env   # VITE_API_URL=http://revent-backend.test/api
npm run dev            # desarrollo
npm run build          # compilación en dist/
npm run test:utils     # prueba del reparto de curvas (sin backend)
npm run smoke          # prueba de humo contra la API real (ver abajo)
```

## Estructura

```
src/
  main.js, App.vue, router.js      arranque, contenedores globales (alertas, confirmaciones) y rutas lazy con guard de sesión/permisos
  config/                          apiConfig.js (VITE_API_URL), http.js (axios + token), interceptors.js (401 => /login)
  models/<Recurso>.js              campos y valores por defecto (extienden BaseModel)
  services/<Recurso>Service.js     all/find/store/update/delete/restore (+ acciones); BaseService.js tiene la fábrica
  stores/                          authStore (sesión, permisos, menú), alertStore, swalStore, uiStore (tema, modo de tabla)
  composables/                     useResourceController (lista, paginación, paneles, guardar...), useOptions, useServerErrors, usePermissions
  components/
    controllers/<Grupo>/<Recurso>Controller.vue   estado, paginación, llamadas al servicio, alertas y eventos
    templates/<Grupo>/<Recurso>/                  configuration.vue (campos, columnas, filtros) + <Recurso>.vue (orquesta paneles) + plantillas propias
    UI/                            AlertContainer, SwalContainer
    UI/templates/                  ResourceScreen/Index/Form/Show, Button, SearchSelect, LocationSelect, FileUpload, CheckList, Pagination, Skeleton, EmptyState...
    layout/                        DefaultLayout, AppSidebar (menú dinámico con respaldo estático), AppHeader, AppFooter, AppBreadcrumb
  pages/                           Login, Dashboard, Profile, ErrorPage (403/404/500)
  utils/                           format, paths, configHelpers, orderMatrix (curvas y totales), swal (atajos a los stores)
  scss/style.scss                  tokens --revent-* y paleta de CoreUI
scripts/                           smoke-api.mjs, test-utils.mjs
```

Grupos: `Setting` (Configuración: usuarios, personas, empleados, roles, permisos, módulos y submódulos, auditoría), `Administration` (áreas, cargos, catálogos de personal, tipos, ubicaciones) y `Production` (colecciones, productos, fichas técnicas, órdenes, colores, tallas, marcas, categorías, proveedores, tiendas).

## Cómo funciona un recurso

Cada recurso tiene **una ruta** (`/colors`, `/people`...). El controlador (`useResourceController`) maneja el panel activo (`index`, `create`, `edit`, `show` o uno propio como permisos) y la plantilla `ResourceScreen` dibuja la lista (tabla o tarjetas, búsqueda, `per_page` 5/10/25/50/100, filtros, esqueletos y vacío), el formulario (modal o página) y el detalle según `configuration.vue`. Los recursos con lógica propia (Productos, Fichas técnicas, Órdenes) reemplazan el formulario y el detalle con sus propias plantillas por medio de slots. Los permisos ocultan botones (`<recurso>.<acción>`), los 422 se pintan en cada campo y los obligatorios llevan asterisco rojo (`FormField required` + `RequiredNote`).

## Agregar un recurso nuevo

1. **Modelo** `src/models/Nombre.js`: `class Nombre extends BaseModel` con `static defaults()` (y `relations(e)` si algún campo viene de una relación, p. ej. `area_id: e.area?.id`).
2. **Servicio** `src/services/NombreService.js`: `export default createService('/ruta')` (o `readOnlyService`; agrega acciones con `call(() => http...)`).
3. **Configuración** `src/components/templates/<Grupo>/Nombre/configuration.vue`: `export const configuration = simpleConfig({...})` para catálogos nombre + descripción, o el objeto completo con `title, singular, permission, listKey, formMode ('modal'|'page'), columns, fields, show, filters, extraActions`. Tipos de campo: `text`, `textarea`, `date`, `email`, `password`, `select`, `remote` (búsqueda remota), `location`, `file`; `required: true` pone el asterisco.
4. **Plantilla** `Nombre.vue`: copia la de cualquier catálogo (renderiza `ResourceScreen`; agrega los slots `#form`, `#show`, `#filters` o `#panel` si necesitas algo propio).
5. **Controlador** `src/components/controllers/<Grupo>/NombreController.vue`: copia uno existente (llama a `useResourceController`).
6. **Ruta y menú**: agrega la entrada en `src/router.js` (`path: ['Nombre', 'Título', 'permiso.all']`) y el ítem en el menú de respaldo de `AppSidebar.vue`.
7. Si el recurso se usa en un `select`, agrégalo a `useOptions.js`.

## Prueba de humo contra la API

`scripts/smoke-api.mjs` usa los servicios y modelos del frontend (cargados con Vite, sin dependencias nuevas) contra una API real: login, `auth/user`, crear/editar/eliminar/restaurar color y talla (con ícono), colección, producto con 2 colores y tallas repetidas, ficha (crear, aprobar, editar aprobada, cancelar, reactivar), proveedor y tiendas, y orden con 2 colores y 3 tiendas (editar, aprobar, cancelar).

```bash
API_URL=http://127.0.0.1:8099/api API_USER=revent API_PASSWORD=<contraseña> npm run smoke
```

La contraseña solo se lee del entorno. El script crea datos con prefijo `SMK`: úsalo solo contra bases de prueba.

## Paleta

Los colores de Revent son provisionales: se cambian en `src/scss/style.scss` (variables `--revent-*` y el `@use ... with (...)` de CoreUI).
