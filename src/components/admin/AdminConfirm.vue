<script setup lang="ts">
withDefaults(
	defineProps<{
		confirmLabel?: string;
		busyLabel?: string;
		busy?: boolean;
	}>(),
	{ confirmLabel: 'Sí, eliminar', busyLabel: 'Procesando...', busy: false },
);

const emit = defineEmits<{ confirm: []; cancel: [] }>();
</script>

<template>
	<div class="admin-confirm" role="group" aria-label="Confirmar acción">
		<span class="admin-confirm-text">¿Confirmas?</span>
		<button class="admin-action admin-action-danger" type="button" :disabled="busy" @click="emit('confirm')">
			{{ busy ? busyLabel : confirmLabel }}
		</button>
		<button class="admin-action" type="button" :disabled="busy" @click="emit('cancel')">Cancelar</button>
	</div>
</template>
