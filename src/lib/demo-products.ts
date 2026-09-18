import type { Producto } from './types';

const imageFallbacks = [
	'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=900&q=80',
	'https://images.unsplash.com/photo-1608181831718-c9d7a2b8f5b1?auto=format&fit=crop&w=900&q=80',
	'https://images.unsplash.com/photo-1602523961358-f9f03dd557db?auto=format&fit=crop&w=900&q=80',
	'https://images.unsplash.com/photo-1603905179139-db12ab535b1d?auto=format&fit=crop&w=900&q=80',
	'https://images.unsplash.com/photo-1572726729986-508ef48d8b9f?auto=format&fit=crop&w=900&q=80',
	'https://images.unsplash.com/photo-1543257580-7269da773bf5?auto=format&fit=crop&w=900&q=80',
];

export const demoProducts: Producto[] = [
	{
		id: 1,
		nombre: 'Vela Calma',
		descripcion: 'Lavanda silvestre, salvia blanca y cedro cálido. Ideal para desconectar al caer la tarde.',
		precioUnitario: 48000,
		stock: 12,
		categoria: { id: 1, nombre: 'Aromáticas' },
		imagenes: [imageFallbacks[0]],
	},
	{
		id: 2,
		nombre: 'Vela Alba',
		descripcion: 'Flor de azahar, bergamota fresca y un toque de lino limpio para comenzar el día con energía serena.',
		precioUnitario: 52000,
		stock: 8,
		categoria: { id: 1, nombre: 'Aromáticas' },
		imagenes: [imageFallbacks[1]],
	},
	{
		id: 3,
		nombre: 'Vela Ámbar & Madera',
		descripcion: 'Notas profundas de sándalo oriental, ámbar resinoso y vainilla bourbon para noches acogedoras.',
		precioUnitario: 56000,
		stock: 14,
		categoria: { id: 2, nombre: 'Colección Exclusiva' },
		imagenes: [imageFallbacks[2]],
	},
	{
		id: 4,
		nombre: 'Vela Ritual Sagrado',
		descripcion:
			'Palo santo ancestral, mirra y eucalipto para momentos de presencia, meditación y limpieza energética.',
		precioUnitario: 45000,
		stock: 6,
		categoria: { id: 3, nombre: 'Rituales' },
		imagenes: [imageFallbacks[3]],
	},
	{
		id: 5,
		nombre: 'Vela Vainilla & Canela',
		descripcion: 'Fragancia dulce y reconfortante con canela en rama de Ceilán y vainilla natural de Madagascar.',
		precioUnitario: 49000,
		stock: 15,
		categoria: { id: 1, nombre: 'Aromáticas' },
		imagenes: [imageFallbacks[4]],
	},
	{
		id: 6,
		nombre: 'Set Trío SERENA',
		descripcion:
			'Caja de regalo artesanal con tres mini velas aromáticas: Calma, Alba y Ámbar en frascos reutilizables.',
		precioUnitario: 95000,
		stock: 5,
		categoria: { id: 4, nombre: 'Edición Regalo' },
		imagenes: [imageFallbacks[5]],
	},
];
