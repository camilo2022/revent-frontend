# TechRevent - Frontend

Frontend en Vue 3 (JavaScript, `<script setup>`) para TechRevent: catálogos, productos, fichas técnicas y órdenes de producción. Usa Vite, CoreUI para Vue, Pinia, Vue Router, Axios, SweetAlert2 y dayjs.

## Instalación

```bash
npm install
cp .env.example .env
```

## Configuración (`.env`)

```
VITE_API_URL=http://revent-backend.test/api
```

`VITE_API_URL` es la URL base de la API de TechRevent (termina en `/api`).

## Comandos

- `npm run dev`: servidor de desarrollo.
- `npm run build`: genera la carpeta `dist/`.
- `npm run preview`: sirve la compilación.
- `npm run test:utils`: prueba rápida del reparto de curvas de tallas (sin backend).

## Estructura

```
src/
  API/                 axios (api.js) e interceptores (401 => /login, 500 => aviso)
  axiosConfig.js       getConfig(): cabecera Authorization con el token
  services/            un servicio por recurso (all/find/store/update/delete/restore + acciones)
  stores/              Pinia: auth (usuario, token, permisos, menú) y ui (sidebar, tema)
  router/              rutas con carga perezosa y guard de sesión/permisos
  layout/, components/ layout, sidebar dinámico, header, DataTable, FormField, CatalogCrud, order/*
  composables/         useCrud (listados), useServerErrors (errores 422), usePermissions, useOptions
  utils/               formato, rutas anidadas, confirmaciones (swal), matriz de la orden
  views/               Login, Dashboard, Catalogs, Products, TechnicalSheets, ProductionOrders
  scss/style.scss      tokens --revent-* y paleta de CoreUI
```

## Pantallas

- Sesión: Login, Mi perfil (`/profile`), Dashboard, 403/404/500.
- Configuración: Usuarios (con permisos), Personas, Empleados, Roles, Permisos, Módulos y Submódulos, Auditoría (filtros y detalle antes/después).
- Administración: Áreas, Cargos (con permisos), Géneros, Tipos de sangre, Administradoras de riesgos, Entidades de salud, Cajas de compensación, Fondos de pensión, Tipos de archivo, Tipos de persona, Tipos de documento, Ubicaciones (solo lectura).
- Producción: Colecciones, Productos, Fichas técnicas, Órdenes de producción, Colores, Tallas, Marcas, Categorías (con subcategorías), Subcategorías, Proveedores, Tiendas.

Las rutas del frontend usan la misma url que la API sin prefijo (`/people`, `/areas`, `/blood_types`...).

## Campos obligatorios

`FormField` recibe `required` y muestra un asterisco rojo (`aria-label="obligatorio"`) junto a la etiqueta. Cada formulario termina con `<RequiredNote />` ("* Campo obligatorio"). En los formularios por configuración basta `required: true` (o `requiredOnCreate: true`) en la definición del campo.

## Agregar un recurso con página propia (lista, formulario, detalle)

1. Servicio en `src/services/` con `makeCrud('/ruta')` (o `makeReadOnly`).
2. Entrada en `src/views/Resources/resources.config.js`: `title`, `route`, `permission`, `service`, `listKey`, `columns`, `fields` (tipos `text`, `textarea`, `date`, `email`, `password`, `select`, `remote`, `location`, `file`) y `show`.
3. En `src/router/index.js` agrega `...crudRoutes('clave', 'ruta', 'Título', 'permiso')` y el ítem en el menú de respaldo de `AppSidebar.vue`.

Componentes compartidos: `RemoteSelect` (búsqueda remota con debounce y paginación), `LocationPicker` (país/departamento/ciudad), `FileUpload` (vista previa), `CheckList` (casillas con búsqueda y grupos).

## Permisos

Las acciones se ocultan si el usuario no tiene el permiso `<recurso>.<acción>` (en `user.permissions[].name`). La API igual valida con 403.

## Agregar un catálogo nuevo al CRUD genérico

1. Crea el servicio en `src/services/` con `makeCrud('/ruta')`.
2. Agrega una entrada en `src/views/Catalogs/catalogs.config.js` con `title`, `singular`, `permission`, `service`, `listKey`, `fields` y `columns` (los campos admiten rutas como `settings.code`).
3. Agrega la ruta en `src/router/index.js` usando `CatalogPage` con `props: { catalog: 'clave' }` y `meta.permission`.
4. Si el menú de la API no lo trae, agrégalo al menú de respaldo en `src/components/AppSidebar.vue`.

## Paleta

Los colores de Revent son provisionales: se cambian en `src/scss/style.scss` (variables `--revent-*` y el `@use ... with (...)` de CoreUI).
