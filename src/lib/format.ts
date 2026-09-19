import { API_BASE_URL } from './config';
import type { Producto } from './types';

const imageFallbacks = [
	'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=900&q=80',
	'https://images.unsplash.com/photo-1608181831718-c9d7a2b8f5b1?auto=format&fit=crop&w=900&q=80',
	'https://images.unsplash.com/photo-1602523961358-f9f03dd557db?auto=format&fit=crop&w=900&q=80',
	'https://images.unsplash.com/photo-1603905179139-db12ab535b1d?auto=format&fit=crop&w=900&q=80',
	'https://images.unsplash.com/photo-1572726729986-508ef48d8b9f?auto=format&fit=crop&w=900&q=80',
	'https://images.unsplash.com/photo-1543257580-7269da773bf5?auto=format&fit=crop&w=900&q=80',
];

const priceFormatter = new Intl.NumberFormat('es-BO', {
	style: 'currency',
	currency: 'BOB',
	maximumFractionDigits: 0,
});

const dateTimeFormatter = new Intl.DateTimeFormat('es-BO', { dateStyle: 'short', timeStyle: 'short' });

export function formatPrice(value: number): string {
	return priceFormatter.format(Number(value));
}

export function formatDateTime(value: string | Date | null | undefined): string {
	if (!value) return '—';
	const date = value instanceof Date ? value : new Date(value);
	if (Number.isNaN(date.getTime())) return '—';
	return dateTimeFormatter.format(date);
}

export function imageUrl(image: string, index = 0): string {
	if (!image) return imageFallbacks[index % imageFallbacks.length];
	if (image.startsWith('http') || image.startsWith('data:')) return image;
	const normalized = image.startsWith('/') ? image : `/${image}`;
	return `${API_BASE_URL}${normalized}`;
}

export function productImage(product: Producto, index = 0): string {
	const image = product.imagenes?.[0];
	if (!image) return imageFallbacks[index % imageFallbacks.length];
	return imageUrl(image, index);
}

export function handleImageError(event: Event, index = 0) {
	const image = event.currentTarget as HTMLImageElement;
	if (image.dataset.fallbackApplied) return;
	image.dataset.fallbackApplied = 'true';
	image.src = imageFallbacks[index % imageFallbacks.length];
}
