import { computed, reactive, watch } from 'vue';
import type { CartLine, Producto } from '../lib/types';

const STORAGE_KEY = 'serena:cart:v1';

interface CartState {
	lines: CartLine[];
	drawerOpen: boolean;
}

const state = reactive<CartState>({ lines: [], drawerOpen: false });

function isValidLine(value: unknown): value is CartLine {
	if (!value || typeof value !== 'object') return false;
	const line = value as CartLine;
	return (
		typeof line.quantity === 'number' &&
		line.quantity > 0 &&
		typeof line.product?.id === 'number' &&
		typeof line.product?.nombre === 'string'
	);
}

function hydrate() {
	if (typeof localStorage === 'undefined') return;
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return;
		const parsed: unknown = JSON.parse(raw);
		if (!Array.isArray(parsed)) return;
		for (const line of parsed.filter(isValidLine)) {
			if (!state.lines.some((item) => item.product.id === line.product.id)) state.lines.push(line);
		}
	} catch {
		localStorage.removeItem(STORAGE_KEY);
	}
}

let hydrated = false;

export function hydrateCart() {
	if (hydrated) return;
	hydrated = true;
	hydrate();
}

function persist() {
	if (typeof localStorage === 'undefined') return;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(state.lines));
	} catch {
		// Almacenamiento no disponible (modo privado o cuota llena): se ignora.
	}
}

watch(() => state.lines, persist, { deep: true });

export const cartCount = computed(() => state.lines.reduce((total, line) => total + line.quantity, 0));
export const cartTotal = computed(() =>
	state.lines.reduce((total, line) => total + Number(line.product.precioUnitario) * line.quantity, 0),
);

export interface AddToCartResult {
	added: boolean;
	limited: boolean;
	remaining: number;
}

export function addToCart(product: Producto, quantity = 1): AddToCartResult {
	const stock = Number(product.stock) || 0;
	const line = state.lines.find((item) => item.product.id === product.id);
	const current = line?.quantity ?? 0;
	const next = Math.min(current + quantity, stock);
	const added = next > current;

	if (added) {
		if (line) line.quantity = next;
		else state.lines.push({ product, quantity: next });
	}

	return { added, limited: next < current + quantity, remaining: stock - next };
}

export function decreaseCartLine(productId: number) {
	const line = state.lines.find((item) => item.product.id === productId);
	if (!line) return;
	if (line.quantity === 1) removeCartLine(productId);
	else line.quantity -= 1;
}

export function removeCartLine(productId: number) {
	state.lines = state.lines.filter((item) => item.product.id !== productId);
}

export function clearCart() {
	state.lines = [];
}

export function openCartDrawer() {
	state.drawerOpen = true;
}

export function closeCartDrawer() {
	state.drawerOpen = false;
}

export const cartStore = state;
