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
			<div v-if="loading" class="pills-skeleton" aria-hidden="true">
				<span v-for="n in 3" :key="n" class="skeleton skeleton-pill-sm"></span>
			</div>
			<div v-else class="categories-pills" role="group" aria-label="Filtrar por categoría">
				<button
					v-for="category in categories"
					:key="category"
					type="button"
					class="category-pill"
					:class="{ active: activeCategory === category }"
					:aria-pressed="activeCategory === category"
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

		<p class="sr-only" role="status">
			{{ loading ? 'Cargando la colección de velas' : `${filteredProducts.length} velas disponibles` }}
		</p>

		<div v-if="loading" class="product-grid" aria-hidden="true">
			<article v-for="n in 8" :key="n" class="product-card skeleton-card">
				<div class="skeleton skeleton-media"></div>
				<div class="product-card-body">
					<div>
						<div class="skeleton skeleton-line skeleton-line-sm"></div>
						<div class="skeleton skeleton-line skeleton-line-lg"></div>
						<div class="skeleton skeleton-line"></div>
					</div>
					<div class="product-card-footer">
						<div class="skeleton skeleton-line skeleton-line-sm"></div>
						<div class="skeleton skeleton-pill"></div>
					</div>
				</div>
			</article>
		</div>

		<div v-else-if="loadError" class="empty-state">
			<span class="empty-state-icon" aria-hidden="true">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
					<path d="M12 9v4"></path>
					<path d="M12 17h.01"></path>
					<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"></path>
				</svg>
			</span>
			<h3>No pudimos cargar la colección</h3>
			<p>{{ loadError }}</p>
			<button class="secondary-button" type="button" @click="retryLoadCatalog">Reintentar</button>
		</div>

		<div v-else-if="!filteredProducts.length" class="empty-state">
			<span class="empty-state-icon" aria-hidden="true">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
					<circle cx="11" cy="11" r="7"></circle>
					<line x1="20.5" y1="20.5" x2="16.2" y2="16.2"></line>
					<line x1="8.5" y1="11" x2="13.5" y2="11"></line>
				</svg>
			</span>
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
					<span class="card-quick-view">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
							<path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z"></path>
							<circle cx="12" cy="12" r="2.6"></circle>
						</svg>
						Vista rápida
					</span>
				</div>

				<div class="product-card-body">
					<div>
						<div class="product-meta">
							<span class="product-category-name">{{ product.categoria?.nombre || 'Aromaterapia' }}</span>
							<span v-if="product.stock" class="product-stock-tag">{{ product.stock }} disp.</span>
						</div>
						<h3 class="product-card-title">
							<button type="button" @click="openProductDetail(product)">{{ product.nombre }}</button>
						</h3>
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
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true">
								<line x1="12" y1="5" x2="12" y2="19"></line>
								<line x1="5" y1="12" x2="19" y2="12"></line>
							</svg>
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
