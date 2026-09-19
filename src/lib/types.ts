export interface Categoria {
	id: number;
	nombre: string;
}

export interface Producto {
	id: number;
	nombre: string;
	descripcion: string;
	precioUnitario: number;
	stock: number;
	imagenes?: string[];
	categoria?: Categoria;
}

export interface CartLine {
	product: Producto;
	quantity: number;
}

export type PaymentMethod = 'transferencia' | 'qr';

export interface VentaDetallePayload {
	idProducto: number;
	cantidad: number;
}

export interface VentaPayload {
	metodoPago: PaymentMethod;
	montoPagado: number;
	cambio: number;
	nombreCliente: string;
	documento?: string;
	detalles: VentaDetallePayload[];
}

export interface Venta {
	id: number;
	codigo: string;
	totalVenta?: number;
	montoPagado?: number;
	metodoPago?: PaymentMethod;
	nombreCliente?: string;
}

export interface QrGenerarResponse {
	codigo: string;
	qrUrl: string;
	estado: string;
	expiraEn?: number;
}

export type QrEstadoRemoto = 'pendiente' | 'aprobado' | 'expirado' | 'rechazado';

export interface QrVerificarResponse {
	estado: QrEstadoRemoto;
	venta?: Venta;
}

export interface UsuarioSesion {
	id: number;
	nombreUsuario: string;
	email: string;
	rolId?: number | null;
	rol?: { id: number; nombre: string } | null;
}

export interface LoginResponse extends UsuarioSesion {
	access_token: string;
}

export interface ProductoInput {
	nombre: string;
	descripcion: string;
	precioUnitario: number;
	stock: number;
	idCategoria: number;
	imagenes?: string[];
}

export interface CategoriaInput {
	nombre: string;
}

export interface DetalleVentaAdmin {
	id: number;
	cantidad: number;
	precioUnitario: number;
	subtotal: number;
	producto?: { id: number; nombre: string } | null;
}

export interface VentaAdmin {
	id: number;
	codigo: string | null;
	totalVenta: number;
	metodoPago: string;
	estado: string;
	fechaCreacion: string;
	fechaAnulacion: string | null;
	montoPagado: number;
	cambio: number;
	nombreCliente?: string | null;
	documento?: string | null;
	usuario?: { id: number; nombreUsuario: string } | null;
	ventadetalles: DetalleVentaAdmin[];
}
