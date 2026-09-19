import { ApiError, request } from './api';
import type {
	Categoria,
	CategoriaInput,
	LoginResponse,
	Producto,
	ProductoInput,
	UsuarioSesion,
	VentaAdmin,
} from './types';
import { clearSession, sessionStore } from '../stores/session';

function toNumber(value: unknown): number {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : 0;
}

async function adminRequest<T>(path: string, options: RequestInit = {}, timeoutMs?: number): Promise<T> {
	const { token } = sessionStore;
	const headers = {
		...(options.headers ?? {}),
		...(token ? { Authorization: `Bearer ${token}` } : {}),
	};

	try {
		return await request<T>(path, { ...options, headers }, timeoutMs);
	} catch (error) {
		if (error instanceof ApiError && error.status === 401) clearSession();
		throw error;
	}
}

export async function loginAdmin(
	nombreUsuario: string,
	clave: string,
): Promise<{ token: string; usuario: UsuarioSesion }> {
	const data = await request<LoginResponse>('auth/login', {
		method: 'POST',
		body: JSON.stringify({ nombreUsuario, clave }),
	});

	return {
		token: data.access_token,
		usuario: {
			id: data.id,
			nombreUsuario: data.nombreUsuario,
			email: data.email,
			rolId: data.rolId ?? null,
			rol: data.rol ?? null,
		},
	};
}

export async function fetchProductosAdmin(): Promise<Producto[]> {
	const data = await adminRequest<Producto[]>('productos');
	return data.map((producto) => ({
		...producto,
		precioUnitario: toNumber(producto.precioUnitario),
		stock: toNumber(producto.stock),
		imagenes: Array.isArray(producto.imagenes) ? producto.imagenes : [],
	}));
}

export function crearProductoAdmin(input: ProductoInput): Promise<Producto> {
	return adminRequest<Producto>('productos', { method: 'POST', body: JSON.stringify(input) });
}

export function actualizarProductoAdmin(id: number, input: Partial<ProductoInput>): Promise<Producto> {
	return adminRequest<Producto>(`productos/${id}`, { method: 'PATCH', body: JSON.stringify(input) });
}

export function eliminarProductoAdmin(id: number): Promise<unknown> {
	return adminRequest(`productos/${id}`, { method: 'DELETE' });
}

export function subirImagenesProducto(id: number, files: File[]): Promise<Producto> {
	const formData = new FormData();
	for (const file of files) formData.append('imagenes', file);
	return adminRequest<Producto>(`productos/${id}/imagenes`, { method: 'POST', body: formData }, 60000);
}

export async function fetchCategoriasAdmin(): Promise<Categoria[]> {
	return adminRequest<Categoria[]>('categorias');
}

export function crearCategoriaAdmin(input: CategoriaInput): Promise<Categoria> {
	return adminRequest<Categoria>('categorias', { method: 'POST', body: JSON.stringify(input) });
}

export function actualizarCategoriaAdmin(id: number, input: CategoriaInput): Promise<Categoria> {
	return adminRequest<Categoria>(`categorias/${id}`, { method: 'PATCH', body: JSON.stringify(input) });
}

export function eliminarCategoriaAdmin(id: number): Promise<unknown> {
	return adminRequest(`categorias/${id}`, { method: 'DELETE' });
}

export async function fetchVentasAdmin(): Promise<VentaAdmin[]> {
	const data = await adminRequest<VentaAdmin[]>('ventas');
	return data.map((venta) => ({
		...venta,
		totalVenta: toNumber(venta.totalVenta),
		montoPagado: toNumber(venta.montoPagado),
		cambio: toNumber(venta.cambio),
		ventadetalles: (venta.ventadetalles ?? []).map((detalle) => ({
			...detalle,
			cantidad: toNumber(detalle.cantidad),
			precioUnitario: toNumber(detalle.precioUnitario),
			subtotal: toNumber(detalle.subtotal),
		})),
	}));
}

export function anularVentaAdmin(id: number): Promise<VentaAdmin> {
	return adminRequest<VentaAdmin>(`ventas/${id}`, { method: 'DELETE' });
}
