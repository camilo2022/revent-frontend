// Pantallas del módulo Integraciones. Para agregar una pantalla basta UNA línea aquí:
//   slug: [NombreControlador, 'Título', 'permiso.de.entrada', icono, credenciales Siigo requeridas]
// - La ruta es `/integration/{slug}` y carga `components/controllers/Integration/{NombreControlador}Controller.vue`.
// - El slug es el mismo de la url del submódulo que siembra el backend (`/integration/{slug}`).
// - credenciales: [] (ninguna), ['token'], ['cookie'] o ['token', 'cookie']; se guarda en `meta.siigo` de la ruta.
// - El icono (de '@coreui/icons') se usa en el menú lateral; se parece al de la tarjeta de "Acciones disponibles" del home.
import {
  cilCamera, cilCart, cilCheckCircle, cilCreditCard, cilDescription, cilFindInPage, cilGlobeAlt, cilHome,
  cilInbox, cilListFilter, cilLoop, cilPeople, cilSearch, cilSync, cilTask, cilTruck,
} from '@coreui/icons'

export const integrationScreens = {
  exports_inventory: ['ExportsInventory', 'Exporte de inventario', 'integration.exports_inventory.send', cilInbox, []], // caja
  exports_invoice: ['ExportsInvoice', 'Exporte de facturas', 'integration.exports_invoice.send', cilDescription, []], // documento
  exports_invoice_360: ['ExportsInvoice360', 'Exporte de facturas 360', 'integration.exports_invoice_360.send', cilGlobeAlt, []], // globo
  exports_purchase: ['ExportsPurchase', 'Exporte de compras', 'integration.exports_purchase.send', cilCart, []], // carrito
  sync_unico: ['SyncUnico', 'Sincronización con Único', 'integration.sync_unico.runs', cilSync, []], // refrescar
  masive_transfers: ['MasiveTransfers', 'Traslados masivos', 'integration.masive_transfers.format', cilLoop, []], // flechas de intercambio
  // La cookie solo se usa para descargar el formato; la carga del archivo no la necesita (ya viene dentro del Excel)
  masive_purchase_orders: ['MasivePurchaseOrders', 'Órdenes de compra masivas', 'integration.masive_purchase_orders.types', cilTask, ['cookie']], // portapapeles con visto
  product_traceability: ['ProductTraceability', 'Trazabilidad de productos', 'integration.product_traceability.warehouses', cilSearch, []], // lupa
  // El token de Siigo solo se pide en la pestaña Explorador (al subir fotos); por eso no se exige a nivel de pantalla
  product_photos: ['ProductPhoto', 'Fotos de producto', 'integration.product_photos.search', cilCamera, []], // cámara
  accounts_payable: ['AccountPayable', 'Cuentas por pagar', 'integration.accounts_payable.settings', cilCreditCard, []], // tarjeta
  inventory_filter: ['InventoryFilter', 'Filtro de inventario', 'integration.inventory_filter.catalogs', cilHome, []], // tienda
  purchase_order_reception: ['PurchaseOrderReception', 'Recepción de órdenes de compra', 'integration.purchase_order_reception.search', cilCheckCircle, ['token']], // caja recibida
  purchase_order_tracking: ['PurchaseOrderTracking', 'Seguimiento de órdenes de compra', 'integration.purchase_order_tracking.documents', cilListFilter, []], // pendientes
  transfer_approval: ['TransferApproval', 'Aprobación de traslados', 'integration.transfer_approval.search', cilTruck, ['token']], // camión
  customer_sales: ['CustomerSales', 'Clientes por venta', 'integration.customer_sales.cost_centers', cilPeople, ['token']], // personas
  search_document: ['SearchDocument', 'Buscar documento', 'integration.search_document.types', cilFindInPage, ['token', 'cookie']], // documento con lupa
}
