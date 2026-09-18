<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { addToCart, hydrateCart } from '../../stores/cart';
import {
	activeCategory,
	applyCategoryFromUrl,
	categories,
	filteredProducts,
	loadCatalog,
	loadError,
	loading,
	query,
	retryLoadCatalog,
	usingDemo,
} from '../../stores/catalog';
import { showToast } from '../../stores/toast';
import { formatPrice, handleImageError, productImage } from '../../lib/format';
import type { Producto } from '../../lib/types';
import ProductDetailModal from './ProductDetailModal.vue';

const selectedProduct = ref<Producto | null>(null);

function openProductDetail(product: Producto) {
	selectedProduct.value = product;
}

function closeProductDetail() {
	selectedProduct.value = null;
}

function handleAdd(product: Producto, quantity = 1) {
	const result = addToCart(product, quantity);

	if (!result.added) {
		showToast(`No hay más stock disponible de "${product.nombre}"`);
		return;
	}
	if (result.limited) {
		showToast(`Agregamos las últimas unidades disponibles de "${product.nombre}"`);
		return;
	}
	showToast(`"${product.nombre}" añadido al carrito`);
}

function handleDetailAdd(quantity: number) {
	if (!selectedProduct.value) return;
	handleAdd(selectedProduct.value, quantity);
	selectedProduct.value = null;
}

function clearFilters() {
	query.value = '';
	activeCategory.value = 'Todos';
}

function handleKeyDown(event: KeyboardEvent) {
	if (event.key === 'Escape') selectedProduct.value = null;
}

onMounted(() => {
	hydrateCart();
	applyCategoryFromUrl();
	loadCatalog();
	window.addEventListener('keydown', handleKeyDown);
});

onBeforeUnmount(() => {
	window.removeEventListener('keydown', handleKeyDown);
});
</script>

<template>
	<section id="coleccion" class="collection-section">
		<div class="catalog-heading">
			<div>
				<span class="eyebrow">Catálogo SERENA</span>
				<h2>Velas para cada rincón y momento</h2>
			</div>
			<p class="heading-sub">
				Selecciona tu fragancia predilecta o haz clic en cualquier vela para conocer sus notas y propiedades.
			</p>
		</div>

		<div class="toolbar">
			<div class="categories-pills" role="tablist" aria-label="Categorías">
				<button
					v-for="category in categories"
					:key="category"
					type="button"
					class="category-pill"
					:class="{ active: activeCategory === category }"
					@click="activeCategory = category"
				>
					{{ category }}
				</button>
			</div>

			<div class="search-box">
				<svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<circle cx="11" cy="11" r="8"></circle>
					<line x1="21" y1="21" x2="16.65" y2="16.65"></line>
				</svg>
				<input
					id="product-search-input"
					v-model="query"
					type="search"
					placeholder="Buscar vela o aroma..."
					aria-label="Buscar productos en el catálogo"
				/>
				<button v-if="query" type="button" class="search-clear" @click="query = ''" aria-label="Limpiar búsqueda">
					✕
				</button>
			</div>
		</div>

		<p v-if="usingDemo" class="catalog-note">
			Mostrando la colección curada de ejemplo. Los productos registrados desde tu panel de administración aparecerán
			aquí automáticamente.
		</p>

		<div v-if="loading" class="empty-state">
			<h3>Preparando la colección...</h3>
			<p>Conectando con el catálogo de SERENA.</p>
		</div>

		<div v-else-if="loadError" class="empty-state">
			<h3>No pudimos cargar la colección</h3>
			<p>{{ loadError }}</p>
			<button class="secondary-button" type="button" @click="retryLoadCatalog">Reintentar</button>
		</div>

		<div v-else-if="!filteredProducts.length" class="empty-state">
			<h3>No encontramos velas para "{{ query }}"</h3>
			<p>Prueba con otros términos como 'lavanda', 'ámbar', 'calma' o selecciona otra categoría.</p>
			<button class="secondary-button" type="button" @click="clearFilters">Ver toda la colección</button>
		</div>

		<div v-else class="product-grid">
			<article v-for="(product, index) in filteredProducts" :key="product.id" class="product-card">
				<div
					class="product-card-image-wrap"
					role="button"
					tabindex="0"
					:aria-label="`Ver detalle de ${product.nombre}`"
					@click="openProductDetail(product)"
					@keydown.enter="openProductDetail(product)"
					@keydown.space.prevent="openProductDetail(product)"
				>
					<div class="card-badges">
						<span class="badge-pill">{{ product.categoria?.nombre || 'Vela de Soya' }}</span>
						<span v-if="product.stock && product.stock <= 5" class="badge-pill stock-low">
							¡Solo quedan {{ product.stock }}!
						</span>
					</div>
					<img
						:src="productImage(product, index)"
						:alt="product.nombre"
						loading="lazy"
						@error="handleImageError($event, index)"
					/>
					<span class="card-quick-view">Vista Rápida 👁️</span>
				</div>

				<div class="product-card-body">
					<div>
						<div class="product-meta">
							<span class="product-category-name">{{ product.categoria?.nombre || 'Aromaterapia' }}</span>
							<span v-if="product.stock" class="product-stock-tag" style="font-size: 11px; color: var(--serena-sage)">
								{{ product.stock }} disp.
							</span>
						</div>
						<h3 class="product-card-title" @click="openProductDetail(product)">{{ product.nombre }}</h3>
						<p class="product-card-desc">{{ product.descripcion }}</p>
					</div>

					<div class="product-card-footer">
						<div class="product-price-block">
							<span class="product-price-label">Precio</span>
							<span class="product-price-val">{{ formatPrice(product.precioUnitario) }}</span>
						</div>

						<button
							class="card-add-button"
							type="button"
							:aria-label="`Añadir ${product.nombre} al carrito`"
							@click.stop="handleAdd(product, 1)"
						>
							<span>+</span>
							<span>Agregar</span>
						</button>
					</div>
				</div>
			</article>
		</div>

		<ProductDetailModal
			v-if="selectedProduct"
			:product="selectedProduct"
			@close="closeProductDetail"
			@add="handleDetailAdd"
		/>
	</section>
</template>
