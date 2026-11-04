<script setup>
import { watch } from 'vue'
import Swal from 'sweetalert2'
import { useSwalStore } from '@/stores/swalStore'

// Muestra con SweetAlert2 lo que pida el swalStore y devuelve la respuesta
const store = useSwalStore()

watch(
  () => store.swalData,
  async (data) => {
    if (!data) return
    const result = await Swal.fire({
      title: data.title,
      text: data.text,
      icon: data.icon,
      showCancelButton: true,
      confirmButtonText: data.confirmText,
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#321fdb',
      reverseButtons: true,
      focusCancel: data.icon === 'warning',
      customClass: { popup: 'swal-revent' },
    })
    store.resolveSwal(result.isConfirmed)
  },
)
</script>

<template>
  <span hidden />
</template>
