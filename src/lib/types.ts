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
