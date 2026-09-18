import { reactive, ref } from 'vue';
import { crearVenta } from '../lib/api';
import { DEMO_MODE, MAX_CUSTOMER_NAME_LENGTH } from '../lib/config';
import type { PaymentMethod, VentaPayload } from '../lib/types';
import { cartStore, cartTotal, clearCart } from '../stores/cart';
import { usingDemo } from '../stores/catalog';

export interface CheckoutForm {
	name: string;
	phone: string;
	address: string;
	document: string;
	paymentMethod: PaymentMethod;
}

export function useCheckout() {
	const form = reactive<CheckoutForm>({
		name: '',
		phone: '',
		address: '',
		document: '',
		paymentMethod: 'transferencia',
	});
	const error = ref('');
	const submitting = ref(false);

	function buildCustomerName(): string {
		const address = form.address.trim();
		return `${form.name.trim()} | Tel: ${form.phone.trim()}${address ? ` | Dir: ${address}` : ''}`;
	}

	function validate(): string {
		if (!form.name.trim()) return 'Por favor escribe tu nombre completo.';
		if (!form.phone.trim()) return 'Por favor escribe tu teléfono o WhatsApp para coordinar el envío.';
		if (!cartStore.lines.length) return 'Tu carrito está vacío.';
		if (buildCustomerName().length > MAX_CUSTOMER_NAME_LENGTH) {
			return `El nombre, teléfono y dirección superan los ${MAX_CUSTOMER_NAME_LENGTH} caracteres permitidos. Acorta la dirección e intenta nuevamente.`;
		}
		return '';
	}

	function buildPayload(): VentaPayload {
		return {
			metodoPago: form.paymentMethod,
			montoPagado: cartTotal.value,
			cambio: 0,
			nombreCliente: buildCustomerName(),
			documento: form.document.trim() || undefined,
			detalles: cartStore.lines.map((line) => ({ idProducto: line.product.id, cantidad: line.quantity })),
		};
	}

	async function submitTransfer(): Promise<string | null> {
		error.value = validate();
		if (error.value) return null;

		submitting.value = true;
		try {
			const venta = await crearVenta(buildPayload());
			clearCart();
			return venta.codigo || String(venta.id);
		} catch (submitError) {
			if (DEMO_MODE && usingDemo.value) {
				clearCart();
				return `SERENA-${Math.floor(1000 + Math.random() * 9000)}`;
			}
			error.value =
				submitError instanceof Error ? submitError.message : 'No pudimos registrar tu pedido. Intenta nuevamente.';
			return null;
		} finally {
			submitting.value = false;
		}
	}

	return { form, error, submitting, validate, buildCustomerName, buildPayload, submitTransfer };
}
