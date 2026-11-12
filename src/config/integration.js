// Credenciales de Siigo que se pegan en "Autorización Siigo" y se adjuntan solas a las acciones de Integraciones
export const TOKEN_TTL_MIN = 240 // si el JWT trae `exp` menor, gana `exp`
export const COOKIE_TTL_MIN = 240
export const EXPIRING_MIN = 30 // aviso cuando falta poco para que venza

export const KINDS = {
  token: {
    label: 'Token',
    ttl: TOKEN_TTL_MIN,
    hint: 'Pega lo que entrega el botón «Token» de la extensión (en la versión anterior se llamaba «Buscar Cookie»).',
    uses: ['Clientes por venta', 'Aprobación de traslados', 'Recepción de órdenes de compra', 'Fotos de producto (enviar a Siigo)', 'Buscar documento: nota de traslado'],
  },
  cookie: {
    label: 'Cookie',
    ttl: COOKIE_TTL_MIN,
    hint: 'Pega lo que entrega el botón «Cookie» de la extensión (en la versión anterior se llamaba «Buscar SessionId»).',
    uses: ['Órdenes de compra masivas (formato)', 'Buscar documento: orden de compra'],
  },
}

// Estados: empty (vacía), ok (vigente), expiring (vence pronto), expired (venció), invalid (Siigo la rechazó)
export const STATUS = {
  empty: { label: 'Sin cargar', color: 'secondary' },
  ok: { label: 'Vigente', color: 'success' },
  expiring: { label: 'Vence pronto', color: 'warning' },
  expired: { label: 'Vencida', color: 'danger' },
  invalid: { label: 'No válida', color: 'danger' },
}
