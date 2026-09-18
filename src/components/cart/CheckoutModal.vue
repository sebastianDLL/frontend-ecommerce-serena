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
			<span class="eyebrow">Finalizar pedido</span>
			<h2>Detalles de entrega</h2>

			<div class="checkout-order-summary">
				<span>Total de la orden ({{ cartCount }} artículos)</span>
				<strong>{{ formatPrice(cartTotal) }}</strong>
			</div>

			<div v-if="checkoutError" class="form-error" role="alert">{{ checkoutError }}</div>

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
				<label>Método de pago</label>
				<div class="payment-method-tabs">
					<button
						type="button"
						:class="['pay-tab', { active: form.paymentMethod === 'transferencia' }]"
						@click="form.paymentMethod = 'transferencia'"
					>
						<span class="pay-tab-icon" aria-hidden="true">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
								<path d="M3 10 12 4l9 6"></path>
								<path d="M5 10v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9"></path>
								<path d="M9.5 20v-5.5h5V20"></path>
							</svg>
						</span>
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
						<span class="pay-tab-icon" aria-hidden="true">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
								<rect x="3.5" y="3.5" width="6" height="6" rx="1.2"></rect>
								<rect x="14.5" y="3.5" width="6" height="6" rx="1.2"></rect>
								<rect x="3.5" y="14.5" width="6" height="6" rx="1.2"></rect>
								<path d="M14.5 14.5h3v3h-3z"></path>
								<path d="M20.5 14.5v6h-3"></path>
							</svg>
						</span>
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

				<div v-else-if="qrEstado === 'aprobado'" class="qr-approved" role="status">
					<div class="qr-check">
						<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
							<path d="M20 6L9 17l-5-5"></path>
						</svg>
					</div>
					<p>Pago verificado. Registrando tu pedido...</p>
				</div>

				<div v-else-if="qrEstado === 'error'" class="form-error form-error-inline" role="alert">
					{{ qrError }}
					<button type="button" class="form-error-action" @click="resetQr()">Intentar de nuevo</button>
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
				<span v-else>Confirmar pedido ({{ formatPrice(cartTotal) }})</span>
				<span v-if="!submitting && qrEstado === 'idle'">→</span>
				<span v-else class="button-loader" aria-hidden="true"></span>
			</button>
		</form>
	</div>
</template>
