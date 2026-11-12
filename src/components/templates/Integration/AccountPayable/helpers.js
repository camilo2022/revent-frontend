import dayjs from 'dayjs'
import { errorMessage } from '@/utils/format'

// Pesos con decimales (los saldos de Siigo traen centavos)
export const cop = (value) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 2 }).format(Number(value) || 0)

export const quantity = (value) => (Number(value) || 0).toLocaleString('es-CO', { maximumFractionDigits: 2 })

// Fecha corta; los valores ISO ("2026-01-31T00:00:00") no se desfasan por zona horaria
export const day = (value) => (value ? dayjs(String(value).slice(0, 10)).format('DD/MM/YYYY') : '-')

export const datePart = (value) => String(value ?? '').slice(0, 10)

export const todayBogota = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date())

export const normalizeText = (value) =>
  String(value ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

// Primer error de validación de la API, o el mensaje general
export const firstError = (error) => {
  const first = error?.errors ? Object.values(error.errors).flat()[0] : null
  return first || errorMessage(error)
}

// ------------------------------------------------------------------ Clasificación de documentos

// Clasificación por prefijo (novedades, descuento, recibo de pago) y errores calculados (ERR1 duplicado, ERR2 vencimiento)
export const CLASSIFICATIONS = [
  { key: 'NOV1', label: 'Faltantes', color: '#fca5a5' },
  { key: 'NOV2', label: 'Sobrantes', color: '#86efac' },
  { key: 'NOV3', label: 'Trocados', color: '#93c5fd' },
  { key: 'NOV4', label: 'Corrección de factura', color: '#fdba74' },
  { key: 'NOV5', label: 'Mercancía mal estado', color: '#fde047' },
  { key: 'DES1', label: 'Descuento', color: '#d8b4fe' },
  { key: 'RP', label: 'Recibo de pago', color: '#d1d5db' },
  { key: 'ERR1', label: 'Duplicado', color: '#000000' },
  { key: 'ERR2', label: 'Vencimiento erróneo', color: '#795548' },
]
const KNOWN = CLASSIFICATIONS.map((c) => c.key)

// Prefijos sobre los que se evalúan ERR1 y ERR2 (los RP se excluyen: su fecha de creación y vencimiento suele coincidir)
const ERROR_PREFIXES = ['FC', 'RM']

const prefixOf = (doc) => String(doc.DuePrefix ?? '').toUpperCase()

export const isValid = (doc) => {
  const p = prefixOf(doc)
  return (p === 'FC' || p === 'RM' || p.startsWith('RP') || p.startsWith('DES')) && !doc.IsAnnulled
}

export const isSelectable = (doc) => {
  const p = prefixOf(doc)
  return (p === 'FC' || p === 'RM' || p.startsWith('DES')) && !doc.IsAnnulled
}

export const isReceipt = (doc) => prefixOf(doc).startsWith('RP') && !doc.IsAnnulled

const canHaveError = (doc) => !doc.IsAnnulled && ERROR_PREFIXES.includes(prefixOf(doc))

// ERR1: mismo DueName en 2 o más documentos. ERR2: fecha de creación y de vencimiento iguales.
export function computeMeta(docs) {
  const counts = {}
  docs.forEach((doc) => {
    if (!canHaveError(doc)) return
    const key = String(doc.DueName ?? '').trim()
    if (key) counts[key] = (counts[key] || 0) + 1
  })
  return docs.map((doc) => {
    if (!canHaveError(doc)) return { dup: false, sameDate: false }
    const key = String(doc.DueName ?? '').trim()
    const created = datePart(doc.CreatedDate)
    return { dup: !!key && counts[key] > 1, sameDate: !!created && created === datePart(doc.DueDate) }
  })
}

export const hasError = (meta) => !!(meta?.dup || meta?.sameDate)

export const errorTitle = (meta) =>
  [meta?.dup && 'ERR1: documento duplicado', meta?.sameDate && 'ERR2: la fecha de creación y de vencimiento son la misma'].filter(Boolean).join(' | ')

// Claves de clasificación del documento, en orden de prioridad visual
export function classKeys(doc, meta) {
  const keys = []
  if (meta?.dup) keys.push('ERR1')
  if (meta?.sameDate) keys.push('ERR2')
  const p = prefixOf(doc)
  const base = p.startsWith('RP') ? 'RP' : p
  if (KNOWN.includes(base)) keys.push(base)
  return keys
}

export const rowClass = (doc, meta) => {
  const key = classKeys(doc, meta)[0]
  return key ? `ap-row-${key.toLowerCase()}` : ''
}

// Estado de vencimiento del documento
export function estado(doc) {
  if (doc.IsAnnulled) return { label: 'Anulado', color: 'secondary' }
  if (Number(doc.VencidoMasDe90) > 0) return { label: 'Vencido +90', color: 'danger' }
  if (Number(doc.VencidoDe61a90) > 0) return { label: 'Vencido 61-90', color: 'danger' }
  if (Number(doc.VencidoDe31a60) > 0) return { label: 'Vencido 31-60', color: 'warning' }
  if (Number(doc.VencidoDe1a30) > 0) return { label: 'Vencido 1-30', color: 'warning' }
  if (Number(doc.PorVencer) > 0) return { label: 'Por vencer', color: 'info' }
  return { label: 'Al día', color: 'success' }
}

// Texto en el que busca el filtro de documentos (con "información completa" incluye orden, observaciones y bodegas)
export function searchText(doc, meta, allData) {
  const parts = [
    doc.DuePrefix, doc.DueName, doc.DocName, doc.TotalValue, cop(doc.TotalValue), doc.Deuda, cop(doc.Deuda), doc.Saldo, cop(doc.Saldo),
    day(doc.DueDate), datePart(doc.DueDate), day(doc.CreatedDate), datePart(doc.CreatedDate), estado(doc).label,
  ]
  classKeys(doc, meta).forEach((key) => parts.push(key, CLASSIFICATIONS.find((c) => c.key === key)?.label))
  if (allData) {
    const entry = doc.PurchaseEntry ?? {}
    const detail = doc.PurchaseEntryDetail ?? {}
    parts.push(entry.docName, detail.Observations, detail.WarehouseCodes, detail.Quantity)
  }
  return normalizeText(parts.filter((p) => p !== null && p !== undefined).join(' '))
}

// ------------------------------------------------------------------ Proveedores y resumen

export const providerExpired = (p) =>
  (Number(p.Expired1to30) || 0) + (Number(p.Expired31to60) || 0) + (Number(p.Expired61to90) || 0) + (Number(p.ExpiredMoreTo91) || 0)

// Resumen del proveedor con los valores reales de sus documentos ya cargados
export function summarize(docs) {
  return docs.reduce(
    (acc, doc) => {
      if (!isValid(doc)) return acc
      acc.BalanceToExpire += Number(doc.PorVencer) || 0
      acc.TotalBalance += Number(doc.Saldo) || 0
      acc.Expired1to30 += Number(doc.VencidoDe1a30) || 0
      acc.Expired31to60 += Number(doc.VencidoDe31a60) || 0
      acc.Expired61to90 += Number(doc.VencidoDe61a90) || 0
      acc.ExpiredMoreTo91 += Number(doc.VencidoMasDe90) || 0
      acc.BalanceInFavor += Number(doc.BalanceInFavor) || 0
      return acc
    },
    { BalanceToExpire: 0, TotalBalance: 0, Expired1to30: 0, Expired31to60: 0, Expired61to90: 0, ExpiredMoreTo91: 0, BalanceInFavor: 0 }
  )
}

// ------------------------------------------------------------------ Datos que viajan al backend

// El backend solo necesita estos datos del proveedor y de cada documento (el correo usa los demás campos listados)
export const slimProvider = (provider) => ({ AccountID: provider.AccountID, MsThirdPartyID: provider.MsThirdPartyID })

export const slimDoc = (doc) => ({
  DuePrefix: doc.DuePrefix,
  DueName: doc.DueName,
  DueDate: doc.DueDate,
  DocName: doc.DocName,
  Saldo: doc.Saldo,
  ACEntryID: doc.ACEntryID,
})

// Imagen del comprobante: JPG o PNG de hasta 8 MB
export const RECEIPT_EXT = ['jpg', 'jpeg', 'png']
export const RECEIPT_MAX_MB = 8
export function receiptError(file) {
  if (!file) return ''
  if (!RECEIPT_EXT.includes(file.name.split('.').pop().toLowerCase())) return 'Solo se permiten imágenes JPG o PNG.'
  if (file.size > RECEIPT_MAX_MB * 1024 * 1024) return `La imagen supera ${RECEIPT_MAX_MB} MB.`
  return ''
}

// ------------------------------------------------------------------ Cruce contable

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100

// Cruce entre los documentos elegidos y los recibos de pago (saldo a favor). Solo se usan los recibos necesarios, en orden,
// y el saldo se reparte en cascada. Devuelve { error } si el saldo a favor no alcanza para cubrir al menos cada documento.
export function conciliationPlan(selectedDebts, receiptDocs) {
  const needed = selectedDebts.reduce((sum, d) => sum + (Number(d.Saldo) || 0), 0)

  const usedReceipts = []
  let accumulated = 0
  for (const doc of receiptDocs) {
    if (accumulated >= needed) break
    usedReceipts.push(doc)
    accumulated += Math.abs(Number(doc.Saldo) || 0)
  }

  let remaining = accumulated
  let debtTotal = 0
  let coveredTotal = 0
  let insufficient = false

  const debts = selectedDebts.map((doc) => {
    const saldo = Number(doc.Saldo) || 0
    const covered = Math.min(remaining, saldo)
    remaining -= covered
    debtTotal += saldo
    coveredTotal += covered
    if (covered <= 0) insufficient = true
    return { doc, saldo, covered: round2(covered) }
  })

  if (insufficient) {
    return { error: 'Los documentos seleccionados exceden el saldo a favor disponible en los recibos de pago. Quita alguno o selecciona menos documentos.' }
  }

  let toConsume = coveredTotal
  const receipts = usedReceipts.map((doc) => {
    const saldo = Math.abs(Number(doc.Saldo) || 0)
    const used = Math.min(toConsume, saldo)
    toConsume -= used
    return { doc, saldo, used: round2(used) }
  })

  return { debts, receipts, receiptTotal: accumulated, debtTotal, coveredTotal: round2(coveredTotal) }
}
