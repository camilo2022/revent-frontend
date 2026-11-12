<script setup>
import { itemMatches, money, pendingColor, pendingText, qty, receivedColor, warehouseValue } from './helpers'

// Ítems de una orden de compra con lo recibido en cada factura. Los ítems que coinciden con los filtros por referencia,
// modelo, color, talla o bodega se resaltan; los demás se siguen mostrando.
defineProps({ order: { type: Object, required: true }, filters: { type: Object, required: true } })

const pending = (item) => (item.Pending !== undefined && item.Pending !== null ? Number(item.Pending) : (Number(item.Confirmed) || 0) - (Number(item.Quantity) || 0))
</script>

<template>
  <div class="py-2">
    <div class="fw-semibold mb-2">Ítems de {{ order.DocName }} · {{ (order.Items ?? []).length }} referencia(s)</div>
    <p v-if="order.Observations" class="small text-body-secondary mb-2"><strong>Observación:</strong> {{ order.Observations }}</p>

    <div v-if="!(order.Items ?? []).length" class="text-body-secondary small">Esta orden no tiene ítems.</div>
    <div v-else class="table-responsive">
      <table class="table table-sm align-middle small mb-0">
        <thead>
          <tr>
            <th>Referencia</th>
            <th>Modelo</th>
            <th>Color</th>
            <th>Categoría</th>
            <th>Talla</th>
            <th>Bodega</th>
            <th class="text-end">Valor unit.</th>
            <th class="text-end">Valor total</th>
            <th class="text-end">Solicitada</th>
            <th class="text-end">Recibida</th>
            <th class="text-end">Pendiente</th>
            <th>Facturas</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, i) in order.Items" :key="i" :class="{ 'table-warning': itemMatches(item, filters) }">
            <td><CBadge color="light" class="text-dark border">{{ item.Reference || '-' }}</CBadge></td>
            <td>{{ item.Model || '-' }}</td>
            <td>{{ item.Color || '-' }}</td>
            <td>{{ item.Category || '-' }}</td>
            <td>{{ item.Size || '-' }}</td>
            <td>{{ warehouseValue(item.Warehouse) }}</td>
            <td class="text-end">{{ money(item.UnitValue) }}</td>
            <td class="text-end">{{ money(item.Value) }}</td>
            <td class="text-end">{{ qty(item.Quantity) }}</td>
            <td class="text-end"><span :class="['fw-semibold', receivedColor(item.Confirmed, item.Quantity)]">{{ qty(item.Confirmed) }}</span></td>
            <td class="text-end"><span :class="['fw-semibold', pendingColor(pending(item))]">{{ pendingText(pending(item)) }}</span></td>
            <td>
              <div v-for="invoice in item.Invoices ?? []" :key="invoice.ACEntryID" class="text-nowrap">
                <a :href="invoice.Link" target="_blank" rel="noopener noreferrer">{{ invoice.DocName || '-' }}</a>
                <span class="text-body-secondary"> · {{ qty(invoice.Quantity) }} und.</span>
              </div>
              <span v-if="!(item.Invoices ?? []).length" class="text-body-secondary">Sin recibir</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
