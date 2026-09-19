<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { eliminarProductoAdmin, fetchCategoriasAdmin, fetchProductosAdmin } from '../../lib/admin-api';
import { useAdminGuard } from '../../composables/useAdminGuard';
import { formatPrice, handleImageError, productImage } from '../../lib/format';
import type { Categoria, Producto } from '../../lib/types';
import AdminConfirm from './AdminConfirm.vue';
import ProductoFormModal from './ProductoFormModal.vue';

const { authorized } = useAdminGuard();

const productos = ref<Producto[]>([]);
const categorias = ref<Categoria[]>([]);
const loading = ref(false);
const error = ref('');
const feedback = ref('');
const query = ref('');
const categoriaFilter = ref('Todas');
const modalOpen = ref(false);
const editing = ref<Producto | null>(null);
const deletingId = ref<number | null>(null);
const confirmingId = ref<number | null>(null);

async function load() {
	loading.value = true;
	error.value = '';

	try {
		const [productosData, categoriasData] = await Promise.all([fetchProductosAdmin(), fetchCategoriasAdmin()]);
		productos.value = productosData;
		categorias.value = categoriasData;
	} catch (loadError) {
		error.value = loadError instanceof Error ? loadError.message : 'No pudimos cargar los productos.';
	} finally {
		loading.value = false;
	}
}

watch(
	authorized,
	(value) => {
		if (value && !productos.value.length && !loading.value) load();
	},
	{ immediate: true },
);

const filtered = computed(() => {
	const term = query.value.trim().toLowerCase();
	return productos.value.filter((producto) => {
		const matchesQuery = !term || `${producto.nombre} ${producto.descripcion}`.toLowerCase().includes(term);
		const matchesCategory = categoriaFilter.value === 'Todas' || producto.categoria?.nombre === categoriaFilter.value;
		return matchesQuery && matchesCategory;
	});
});

function openCreate() {
	editing.value = null;
	modalOpen.value = true;
}

function openEdit(producto: Producto) {
	editing.value = producto;
	modalOpen.value = true;
}

function closeModal() {
	modalOpen.value = false;
	editing.value = null;
}

function handleSaved(producto: Producto) {
	const index = productos.value.findIndex((item) => item.id === producto.id);
	if (index >= 0) productos.value[index] = producto;
	else productos.value = [producto, ...productos.value];

	feedback.value = `Producto "${producto.nombre}" guardado correctamente.`;
	closeModal();
}

async function removeProducto(producto: Producto) {
	deletingId.value = producto.id;
	error.value = '';

	try {
		await eliminarProductoAdmin(producto.id);
		productos.value = productos.value.filter((item) => item.id !== producto.id);
		feedback.value = `Producto "${producto.nombre}" eliminado.`;
		confirmingId.value = null;
	} catch (deleteError) {
		error.value = deleteError instanceof Error ? deleteError.message : 'No pudimos eliminar el producto.';
		confirmingId.value = null;
	} finally {
		deletingId.value = null;
	}
}

function stockBadge(producto: Producto): { label: string; className: string } {
	if (producto.stock <= 0) return { label: 'Sin stock', className: 'admin-badge-danger' };
	if (producto.stock <= 5) return { label: `${producto.stock} unidades`, className: 'admin-badge-warning' };
	return { label: `${producto.stock} unidades`, className: 'admin-badge-neutral' };
}
</script>

<template>
	<div v-if="authorized" class="admin-products admin-view">
		<div v-if="error" class="form-error" role="alert">{{ error }}</div>
		<div v-else-if="feedback" class="admin-feedback" role="status">{{ feedback }}</div>

		<div class="admin-toolbar">
			<div class="admin-search">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
					<circle cx="11" cy="11" r="8"></circle>
					<line x1="21" y1="21" x2="16.65" y2="16.65"></line>
				</svg>
				<input v-model="query" type="search" placeholder="Buscar producto..." aria-label="Buscar productos" />
			</div>

			<div class="admin-toolbar-filters">
				<select v-model="categoriaFilter" aria-label="Filtrar por categoría">
					<option value="Todas">Todas las categorías</option>
					<option v-for="categoria in categorias" :key="categoria.id" :value="categoria.nombre">
						{{ categoria.nombre }}
					</option>
				</select>

				<button class="primary-button" type="button" @click="openCreate">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true">
						<line x1="12" y1="5" x2="12" y2="19"></line>
						<line x1="5" y1="12" x2="19" y2="12"></line>
					</svg>
					<span>Nuevo producto</span>
				</button>
			</div>
		</div>

		<div class="admin-card">
			<p class="sr-only" role="status">{{ loading ? 'Cargando productos' : `${filtered.length} productos` }}</p>

			<div v-if="loading" class="admin-skeleton-rows" aria-hidden="true">
				<span v-for="n in 5" :key="n" class="admin-skeleton admin-skeleton-row"></span>
			</div>

			<div v-else-if="!filtered.length" class="admin-empty">
				<span class="empty-state-icon" aria-hidden="true">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
						<circle cx="11" cy="11" r="7"></circle>
						<line x1="20.5" y1="20.5" x2="16.2" y2="16.2"></line>
						<line x1="8.5" y1="11" x2="13.5" y2="11"></line>
					</svg>
				</span>
				<h3>No hay productos que coincidan</h3>
				<p>Prueba con otro término o crea un producto nuevo.</p>
			</div>

			<div v-else class="admin-table-wrap">
				<table class="admin-table">
					<thead>
						<tr>
							<th>Producto</th>
							<th>Categoría</th>
							<th>Precio</th>
							<th>Stock</th>
							<th>Imágenes</th>
							<th aria-label="Acciones"></th>
						</tr>
					</thead>
					<tbody>
						<tr v-for="producto in filtered" :key="producto.id">
							<td>
								<div class="admin-table-product">
									<img
										class="admin-table-thumb"
										:src="productImage(producto)"
										:alt="producto.nombre"
										@error="handleImageError"
									/>
									<div class="admin-table-product-info">
										<strong>{{ producto.nombre }}</strong>
										<span>{{ producto.descripcion }}</span>
									</div>
								</div>
							</td>
							<td>
								<span class="admin-badge admin-badge-neutral">{{ producto.categoria?.nombre || 'Sin categoría' }}</span>
							</td>
							<td class="admin-numeric">{{ formatPrice(producto.precioUnitario) }}</td>
							<td>
								<span class="admin-badge" :class="stockBadge(producto).className">{{
									stockBadge(producto).label
								}}</span>
							</td>
							<td class="admin-numeric">{{ producto.imagenes?.length ?? 0 }}</td>
							<td>
								<div class="admin-table-actions">
									<AdminConfirm
										v-if="confirmingId === producto.id"
										:busy="deletingId === producto.id"
										busy-label="Eliminando..."
										@confirm="removeProducto(producto)"
										@cancel="confirmingId = null"
									/>
									<template v-else>
										<button class="admin-action" type="button" @click="openEdit(producto)">
											<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
												<path d="M12 20h9"></path>
												<path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"></path>
											</svg>
											<span>Editar</span>
										</button>
										<button
											class="admin-action admin-action-danger"
											type="button"
											:aria-label="`Eliminar ${producto.nombre}`"
											@click="confirmingId = producto.id"
										>
											<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
												<path d="M3 6h18"></path>
												<path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"></path>
												<path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
											</svg>
											<span>Eliminar</span>
										</button>
									</template>
								</div>
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>

		<ProductoFormModal
			v-if="modalOpen"
			:producto="editing"
			:categorias="categorias"
			@close="closeModal"
			@saved="handleSaved"
		/>
	</div>
</template>
