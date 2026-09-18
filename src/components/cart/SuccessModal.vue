<script setup lang="ts">
import { computed } from 'vue';
import { ORDER_WHATSAPP_URL } from '../../lib/constants';

const props = defineProps<{ code: string; customerName: string }>();
const emit = defineEmits<{ close: [] }>();

const whatsappLink = computed(() => {
	const text = encodeURIComponent(
		`¡Hola SERENA! 🕯️ Acabo de realizar el pedido con código *#${props.code}* a nombre de *${props.customerName}*. Me gustaría confirmar el método de entrega.`,
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
			<span class="eyebrow">¡Pedido Registrado con Éxito!</span>
			<h2>Gracias por elegir SERENA</h2>
			<p style="color: var(--serena-ink-muted); font-size: 14px; margin-bottom: 8px">
				Tu selección ha sido guardada. Nos pondremos en contacto contigo para preparar y despachar tus velas
				artesanales.
			</p>

			<div class="success-code-box">
				<span>Código de Referencia:</span>
				<strong>#{{ code }}</strong>
			</div>

			<a :href="whatsappLink" target="_blank" rel="noopener noreferrer" class="success-whatsapp-btn">
				<span>Confirmar por WhatsApp</span>
				<span>📲</span>
			</a>

			<button
				class="secondary-button"
				style="width: 100%; margin-top: 12px; justify-content: center"
				type="button"
				@click="emit('close')"
			>
				Volver a la Tienda
			</button>
		</div>
	</div>
</template>
