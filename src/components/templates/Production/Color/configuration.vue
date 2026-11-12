<script>
import { simpleConfig, codeField, codeColumn } from '@/utils/configHelpers'

// Datos con los que el filtro de inventario une el color del ERP con el de Siigo (por el nombre) y lo dibuja
const siigoFields = [
  { key: 'settings.siigo_code', label: 'Código en Siigo', type: 'number', hint: 'El código que este color tiene en Siigo.' },
  { key: 'settings.hex', label: 'Color', type: 'color', hint: 'Cómo se ve en el filtro de inventario.' },
  { key: 'settings.macro_category', label: 'Grupo de color', maxlength: 50, hint: 'Agrupa los colores en el filtro. Ej.: BEIGE / CREMA.' },
]
const siigoColumns = [
  { key: 'settings.siigo_code', label: 'Código Siigo' },
  { key: 'settings.hex', label: 'Color' },
  { key: 'settings.macro_category', label: 'Grupo' },
]

// Campos, columnas y filtros del recurso (lo leen el controlador y las plantillas)
export const configuration = simpleConfig({
  title: 'Colores', singular: 'color', permission: 'colors', listKey: 'colors',
  extraFields: [codeField, ...siigoFields], extraColumns: [codeColumn, ...siigoColumns], descUpper: false,
})

export default {}
</script>
