<script setup lang="ts">
import { watch } from 'vue';
import { cartCount, cartTotal, clearCart } from '../../stores/cart';
import { useCheckout } from '../../composables/useCheckout';
import { useQrPayment } from '../../composables/useQrPayment';
import { formatPrice } from '../../lib/format';

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ close: []; success: [code: string, customerName: string] }>();

const {
	form,
	error: checkoutError,
	submitting,
	validate,
	buildCustomerName,
	buildPayload,
	submitTransfer,
} = useCheckout();

const {
	url: qrUrl,
	estado: qrEstado,
	error: qrError,
	start: startQr,
	reset: resetQr,
} = useQrPayment((code) => {
	clearCart();
	emit('success', code, buildCustomerName());
});

watch(
	() => props.open,
	(open) => {
		if (!open) resetQr();
		else checkoutError.value = '';
	},
);

watch(
	() => form.paymentMethod,
	() => resetQr(),
);

async function handleSubmit() {
	if (form.paymentMethod === 'qr') {
		checkoutError.value = validate();
		if (checkoutError.value) return;
		await startQr(buildPayload());
		return;
	}

	const code = await submitTransfer();
	if (code) emit('success', code, buildCustomerName());
}
</script>

<template>
	<div v-if="open" class="modal-backdrop" @click.self="emit('close')" role="dialog" aria-modal="true">
		<form class="checkout-modal" @submit.prevent="handleSubmit">
			<button class="close-button" type="button" @click="emit('close')" aria-label="Cerrar proceso de pago">×</button>
			<span class="eyebrow">Finalizar Pedido</span>
			<h2>Detalles de Entrega</h2>

			<div class="checkout-order-summary">
				<span>Total de la orden ({{ cartCount }} artículos)</span>
				<strong>{{ formatPrice(cartTotal) }}</strong>
			</div>

			<div v-if="checkoutError" class="form-error">{{ checkoutError }}</div>

			<div class="form-group">
				<label for="cust-name">Nombre y Apellido *</label>
				<input id="cust-name" v-model="form.name" type="text" required placeholder="Ej. Valentina Morales" />
			</div>

			<div class="form-group">
				<label for="cust-phone">WhatsApp / Teléfono Móvil *</label>
				<input id="cust-phone" v-model="form.phone" type="tel" required placeholder="Ej. 70 123 456" />
			</div>

			<div class="form-group">
				<label for="cust-address">Dirección y Ciudad de Envío</label>
				<input
					id="cust-address"
					v-model="form.address"
					type="text"
					placeholder="Ej. Av. Arce #1234, Zona Central, La Paz"
				/>
			</div>

			<div class="form-group">
				<label for="cust-doc">Cédula / Documento <span>(opcional)</span></label>
				<input id="cust-doc" v-model="form.document" type="text" placeholder="CI o NIT para tu factura" />
			</div>

			<div class="form-group">
				<label>Método de Pago</label>
				<div class="payment-method-tabs">
					<button
						type="button"
						:class="['pay-tab', { active: form.paymentMethod === 'transferencia' }]"
						@click="form.paymentMethod = 'transferencia'"
					>
						<span class="pay-tab-icon">🏦</span>
						<div>
							<strong>Transferencia</strong>
							<span>Tigo Money / BNB / Banco Unión</span>
						</div>
					</button>
					<button
						type="button"
						:class="['pay-tab', { active: form.paymentMethod === 'qr' }]"
						@click="form.paymentMethod = 'qr'"
					>
						<span class="pay-tab-icon">📲</span>
						<div>
							<strong>Pago QR</strong>
							<span>Escanea y paga al instante</span>
						</div>
					</button>
				</div>
			</div>

			<div v-if="form.paymentMethod === 'qr' && qrEstado !== 'idle'" class="qr-panel">
				<div v-if="qrEstado === 'generando'" class="qr-loading">
					<div class="qr-spinner"></div>
					<p>Generando tu código QR...</p>
				</div>

				<div v-else-if="qrEstado === 'pendiente'" class="qr-waiting">
					<img v-if="qrUrl" :src="qrUrl" alt="Código QR de pago SERENA" class="qr-image" />
					<div class="qr-info">
						<p class="qr-amount">
							Total a pagar: <strong>{{ formatPrice(cartTotal) }}</strong>
						</p>
						<p class="qr-hint">
							Escanea el QR con tu app de billetera. El pedido se confirmará automáticamente al detectar el pago.
						</p>
						<div class="qr-pulse-row">
							<span class="qr-pulse-dot"></span>
							<span>Esperando confirmación de pago...</span>
						</div>
						<button type="button" class="qr-regenerate" @click="resetQr()">Cancelar y volver</button>
					</div>
				</div>

				<div v-else-if="qrEstado === 'aprobado'" class="qr-approved">
					<div class="qr-check">
						<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
							<path d="M20 6L9 17l-5-5"></path>
						</svg>
					</div>
					<p>¡Pago verificado! Registrando tu pedido...</p>
				</div>

				<div v-else-if="qrEstado === 'error'" class="form-error" style="margin-bottom: 0">
					{{ qrError }}
					<button type="button" @click="resetQr()" style="margin-top: 8px; text-decoration: underline; display: block">
						Intentar de nuevo
					</button>
				</div>
			</div>

			<button
				class="primary-button"
				type="submit"
				:disabled="submitting || qrEstado === 'generando' || qrEstado === 'pendiente' || qrEstado === 'aprobado'"
			>
				<span v-if="submitting">Registrando pedido...</span>
				<span v-else-if="qrEstado === 'generando'">Preparando pago...</span>
				<span v-else-if="qrEstado === 'pendiente'">Esperando el pago...</span>
				<span v-else>Confirmar Pedido ({{ formatPrice(cartTotal) }})</span>
				<span v-if="!submitting && qrEstado === 'idle'">→</span>
				<span v-else class="button-loader" aria-hidden="true"></span>
			</button>
		</form>
	</div>
</template>
