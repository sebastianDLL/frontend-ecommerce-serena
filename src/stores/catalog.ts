import { computed, ref } from 'vue';
import { fetchProductos } from '../lib/api';
import { DEMO_MODE } from '../lib/config';
import { demoProducts } from '../lib/demo-products';
import type { Producto } from '../lib/types';

export const products = ref<Producto[]>([]);
export const loading = ref(true);
export const usingDemo = ref(false);
export const loadError = ref('');
export const query = ref('');
export const activeCategory = ref('Todos');

export const categories = computed(() => [
	'Todos',
	...new Set(products.value.map((product) => product.categoria?.nombre).filter(Boolean) as string[]),
]);

export const filteredProducts = computed(() =>
	products.value.filter((product) => {
		const searchTarget = `${product.nombre} ${product.descripcion} ${product.categoria?.nombre || ''}`.toLowerCase();
		const matchesQuery = searchTarget.includes(query.value.trim().toLowerCase());
		const matchesCategory = activeCategory.value === 'Todos' || product.categoria?.nombre === activeCategory.value;
		return matchesQuery && matchesCategory;
	}),
);

export function applyCategoryFromUrl() {
	if (typeof window === 'undefined') return;
	const params = new URLSearchParams(window.location.search);
	const category = params.get('categoria');
	if (category && category !== activeCategory.value) activeCategory.value = category;
	if (params.has('categoria')) {
		params.delete('categoria');
		const queryString = params.toString();
		const cleanUrl = `${window.location.pathname}${queryString ? `?${queryString}` : ''}${window.location.hash}`;
		window.history.replaceState(null, '', cleanUrl);
	}
}

export async function loadCatalog() {
	if (products.value.length) return;
	loading.value = true;
	loadError.value = '';

	try {
		const data = await fetchProductos();
		if (data.length) {
			products.value = data;
			usingDemo.value = false;
		} else if (DEMO_MODE) {
			products.value = demoProducts;
			usingDemo.value = true;
		} else {
			loadError.value = 'La colección estará disponible muy pronto. Vuelve a intentarlo en unos minutos.';
		}
	} catch (error) {
		if (DEMO_MODE) {
			products.value = demoProducts;
			usingDemo.value = true;
		} else {
			loadError.value = error instanceof Error ? error.message : 'No pudimos cargar la colección.';
		}
	} finally {
		loading.value = false;
	}
}

export async function retryLoadCatalog() {
	products.value = [];
	await loadCatalog();
}
