<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { fetchCategoriasAdmin, fetchProductosAdmin, fetchVentasAdmin } from '../../lib/admin-api';
import { useAdminGuard } from '../../composables/useAdminGuard';
import { formatDateTime, formatPrice } from '../../lib/format';
import type { Categoria, Producto, VentaAdmin } from '../../lib/types';

const { authorized } = useAdminGuard();

const productos = ref<Producto[]>([]);
const categorias = ref<Categoria[]>([]);
const ventas = ref<VentaAdmin[]>([]);
const loading = ref(false);
const error = ref('');

async function load() {
	loading.value = true;
	error.value = '';

	try {
		const [productosData, categoriasData, ventasData] = await Promise.all([
			fetchProductosAdmin(),
			fetchCategoriasAdmin(),
			fetchVentasAdmin(),
		]);
		productos.value = productosData;
		categorias.value = categoriasData;
		ventas.value = ventasData;
	} catch (loadError) {
		error.value = loadError instanceof Error ? loadError.message : 'No pudimos cargar el resumen.';
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

const stockBajo = computed(() => productos.value.filter((producto) => producto.stock <= 5));

function isToday(value: string): boolean {
	const date = new Date(value);
	const now = new Date();
	return (
		date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
	);
}

const ventasHoy = computed(() =>
	ventas.value.filter((venta) => isToday(venta.fechaCreacion) && venta.estado !== 'anulada'),
);

const ingresosHoy = computed(() => ventasHoy.value.reduce((total, venta) => total + venta.totalVenta, 0));

const ventasRecientes = computed(() => ventas.value.slice(0, 5));

function estadoBadge(venta: VentaAdmin): { label: string; className: string } {
	if (venta.estado === 'anulada') return { label: 'Anulada', className: 'admin-badge-danger' };
	return { label: 'Realizada', className: 'admin-badge-success' };
}
</script>

<template>
	<div v-if="authorized" class="admin-dashboard">
		<div v-if="error" class="form-error">{{ error }}</div>

		<div class="admin-stats">
			<div class="admin-stat">
				<span class="admin-stat-label">Productos</span>
				<strong class="admin-stat-value">{{ loading ? '—' : productos.length }}</strong>
				<span class="admin-stat-hint">en el catálogo activo</span>
			</div>
			<div class="admin-stat">
				<span class="admin-stat-label">Stock bajo</span>
				<strong class="admin-stat-value">{{ loading ? '—' : stockBajo.length }}</strong>
				<span class="admin-stat-hint">productos con 5 unidades o menos</span>
			</div>
			<div class="admin-stat">
				<span class="admin-stat-label">Categorías</span>
				<strong class="admin-stat-value">{{ loading ? '—' : categorias.length }}</strong>
				<span class="admin-stat-hint">colecciones registradas</span>
			</div>
			<div class="admin-stat">
				<span class="admin-stat-label">Ventas de hoy</span>
				<strong class="admin-stat-value">{{ loading ? '—' : ventasHoy.length }}</strong>
				<span class="admin-stat-hint">{{ formatPrice(ingresosHoy) }} facturados hoy</span>
			</div>
		</div>

		<div class="admin-card">
			<div class="admin-card-head">
				<h2>Últimas ventas</h2>
				<a class="admin-button-ghost" href="/admin/ventas">Ver todas</a>
			</div>
			<div v-if="loading" class="admin-loading">Cargando resumen...</div>
			<div v-else-if="!ventasRecientes.length" class="admin-empty">
				<h3>Todavía no hay ventas</h3>
				<p>Cuando registres la primera venta aparecerá aquí.</p>
			</div>
			<div v-else class="admin-table-wrap">
				<table class="admin-table">
					<thead>
						<tr>
							<th>Código</th>
							<th>Cliente</th>
							<th>Fecha</th>
							<th>Total</th>
							<th>Estado</th>
						</tr>
					</thead>
					<tbody>
						<tr v-for="venta in ventasRecientes" :key="venta.id">
							<td>
								<strong>#{{ venta.codigo || venta.id }}</strong>
							</td>
							<td>{{ venta.nombreCliente || '—' }}</td>
							<td class="admin-numeric">{{ formatDateTime(venta.fechaCreacion) }}</td>
							<td class="admin-numeric">{{ formatPrice(venta.totalVenta) }}</td>
							<td>
								<span class="admin-badge" :class="estadoBadge(venta).className">{{ estadoBadge(venta).label }}</span>
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>

		<div class="admin-card">
			<div class="admin-card-head">
				<h2>Accesos rápidos</h2>
			</div>
			<div class="admin-card-body admin-quick-links">
				<a class="primary-button" href="/admin/productos">
					<span>Gestionar productos</span>
					<span>→</span>
				</a>
				<a class="secondary-button" href="/admin/categorias">
					<span>Categorías</span>
				</a>
				<a class="secondary-button" href="/admin/ventas">
					<span>Ventas</span>
				</a>
			</div>
		</div>
	</div>
</template>
