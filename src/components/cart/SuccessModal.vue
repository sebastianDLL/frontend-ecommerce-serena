<script setup lang="ts">
import { computed } from 'vue';
import { ORDER_WHATSAPP_URL } from '../../lib/constants';

const props = defineProps<{ code: string; customerName: string }>();
const emit = defineEmits<{ close: [] }>();

const whatsappLink = computed(() => {
	const text = encodeURIComponent(
		`Hola SERENA, acabo de realizar el pedido con código *#${props.code}* a nombre de *${props.customerName}*. Me gustaría confirmar el método de entrega.`,
	);
	return `${ORDER_WHATSAPP_URL}?text=${text}`;
});
</script>

<template>
	<div class="modal-backdrop" role="dialog" aria-modal="true">
		<div class="success-modal">
			<div class="success-icon-wrap">
				<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
					<path d="M20 6L9 17l-5-5"></path>
				</svg>
			</div>
			<span class="eyebrow">Pedido registrado</span>
			<h2>Gracias por elegir SERENA</h2>
			<p class="success-modal-text">
				Tu selección ha sido guardada. Nos pondremos en contacto contigo para preparar y despachar tus velas
				artesanales.
			</p>

			<div class="success-code-box">
				<span>Código de referencia:</span>
				<strong>#{{ code }}</strong>
			</div>

			<a :href="whatsappLink" target="_blank" rel="noopener noreferrer" class="success-whatsapp-btn">
				<span>Confirmar por WhatsApp</span>
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
					<path d="M21 11.5a8.4 8.4 0 0 1-12.6 7.3L3.5 20l1.3-4.7A8.4 8.4 0 1 1 21 11.5z"></path>
					<path
						d="M8.5 9.2c.3 1.6 1.9 3.4 3.6 4 .8.3 1.6.4 2-.2l.5-.8-2-.9-.6.7c-.9-.4-1.8-1.3-2.2-2.2l.7-.5-.9-2-.8.5c-.6.4-.5 1.1-.3 1.4z"
					></path>
				</svg>
			</a>

			<button class="secondary-button success-modal-back" type="button" @click="emit('close')">
				Volver a la tienda
			</button>
		</div>
	</div>
</template>
