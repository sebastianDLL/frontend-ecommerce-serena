import { onBeforeUnmount, ref } from 'vue';
import { generarQrPago, verificarQrPago } from '../lib/api';
import type { VentaPayload } from '../lib/types';

export type QrEstado = 'idle' | 'generando' | 'pendiente' | 'aprobado' | 'error';

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_FAILURES = 3;

export function useQrPayment(onApproved: (code: string) => void) {
	const codigo = ref<string | null>(null);
	const url = ref<string | null>(null);
	const estado = ref<QrEstado>('idle');
	const error = ref('');
	let interval: ReturnType<typeof setInterval> | null = null;
	let failures = 0;

	function stopPolling() {
		if (interval) {
			clearInterval(interval);
			interval = null;
		}
	}

	function reset() {
		stopPolling();
		codigo.value = null;
		url.value = null;
		estado.value = 'idle';
		error.value = '';
		failures = 0;
	}

	function startPolling() {
		stopPolling();
		failures = 0;
		interval = setInterval(async () => {
			if (!codigo.value) return;
			try {
				const data = await verificarQrPago(codigo.value);
				failures = 0;

				if (data.estado === 'aprobado') {
					stopPolling();
					if (!data.venta) {
						estado.value = 'error';
						error.value = 'El pago fue aprobado, pero la venta aún no está disponible. Intenta consultar nuevamente.';
						return;
					}
					estado.value = 'aprobado';
					onApproved(data.venta.codigo || String(data.venta.id));
				} else if (data.estado === 'expirado') {
					stopPolling();
					estado.value = 'error';
					error.value = 'El QR expiró. Por favor genera uno nuevo.';
				} else if (data.estado === 'rechazado') {
					stopPolling();
					estado.value = 'error';
					error.value = 'No se pudo completar la venta. Revisa el stock e intenta nuevamente.';
				}
			} catch {
				failures += 1;
				if (failures >= MAX_POLL_FAILURES) {
					stopPolling();
					estado.value = 'error';
					error.value = 'Perdimos la conexión con la tienda. Intenta generar el QR nuevamente.';
				}
			}
		}, POLL_INTERVAL_MS);
	}

	async function start(payload: VentaPayload) {
		reset();
		estado.value = 'generando';
		try {
			const data = await generarQrPago(payload);
			codigo.value = data.codigo;
			url.value = data.qrUrl;
			estado.value = 'pendiente';
			startPolling();
		} catch (startError) {
			estado.value = 'error';
			error.value =
				startError instanceof Error ? startError.message : 'No se pudo generar el QR. Verifica la conexión.';
		}
	}

	onBeforeUnmount(stopPolling);

	return { codigo, url, estado, error, start, reset, stopPolling };
}
