import { API_URL } from './config';
import type { Producto, QrGenerarResponse, QrVerificarResponse, Venta, VentaPayload } from './types';

const REQUEST_TIMEOUT_MS = 15000;

export class ApiError extends Error {
	readonly status?: number;

	constructor(message: string, status?: number) {
		super(message);
		this.name = 'ApiError';
		this.status = status;
	}
}

export async function request<T>(path: string, options: RequestInit = {}, timeoutMs = REQUEST_TIMEOUT_MS): Promise<T> {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), timeoutMs);
	const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

	try {
		const response = await fetch(`${API_URL}/${path}`, {
			...options,
			signal: controller.signal,
			headers: isFormData ? { ...options.headers } : { 'Content-Type': 'application/json', ...options.headers },
		});

		if (!response.ok) {
			let message = 'No pudimos completar la solicitud.';
			try {
				const data = await response.json();
				if (typeof data?.message === 'string') message = data.message;
				else if (Array.isArray(data?.message)) message = data.message.join('. ');
			} catch {
				// La respuesta de error no era JSON: se conserva el mensaje genérico.
			}
			throw new ApiError(message, response.status);
		}

		if (response.status === 204) return undefined as T;
		return (await response.json()) as T;
	} catch (error) {
		if (error instanceof ApiError) throw error;
		if (error instanceof DOMException && error.name === 'AbortError') {
			throw new ApiError('La solicitud tardó demasiado. Verifica tu conexión e intenta nuevamente.');
		}
		throw new ApiError('No pudimos conectar con la tienda. Verifica tu conexión e intenta nuevamente.');
	} finally {
		clearTimeout(timeout);
	}
}

export async function fetchProductos(): Promise<Producto[]> {
	const data = await request<Producto[]>('productos/stock');
	return data.map((producto) => ({
		...producto,
		precioUnitario: Number(producto.precioUnitario),
		stock: Number(producto.stock),
	}));
}

export function crearVenta(payload: VentaPayload): Promise<Venta> {
	return request<Venta>('ventas', { method: 'POST', body: JSON.stringify(payload) });
}

export function generarQrPago(payload: VentaPayload): Promise<QrGenerarResponse> {
	return request<QrGenerarResponse>('pagos/qr/generar', { method: 'POST', body: JSON.stringify(payload) });
}

export function verificarQrPago(codigo: string): Promise<QrVerificarResponse> {
	return request<QrVerificarResponse>(`pagos/qr/${encodeURIComponent(codigo)}/verificar`);
}
