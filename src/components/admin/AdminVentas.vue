<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { anularVentaAdmin, fetchVentasAdmin } from '../../lib/admin-api';
import { useAdminGuard } from '../../composables/useAdminGuard';
import { formatDateTime, formatPrice } from '../../lib/format';
import type { VentaAdmin } from '../../lib/types';
import AdminConfirm from './AdminConfirm.vue';

const { authorized } = useAdminGuard();

const ventas = ref<VentaAdmin[]>([]);
const loading = ref(false);
const error = ref('');
const feedback = ref('');
const query = ref('');
const estadoFilter = ref('Todas');
const expandedId = ref<number | null>(null);
const anulandoId = ref<number | null>(null);
const confirmingId = ref<number | null>(null);

async function load() {
	loading.value = true;
	error.value = '';

	try {
		ventas.value = await fetchVentasAdmin();
	} catch (loadError) {
		error.value = loadError instanceof Error ? loadError.message : 'No pudimos cargar las ventas.';
	} finally {
		loading.value = false;
	}
}

watch(
	authorized,
	(value) => {
		if (value && !ventas.value.length && !loading.value) load();
	},
	{ immediate: true },
);

const filtered = computed(() => {
	const term = query.value.trim().toLowerCase();
	return ventas.value.filter((venta) => {
		const matchesQuery =
			!term ||
			`${venta.codigo ?? ''} ${venta.nombreCliente ?? ''} ${venta.documento ?? ''}`.toLowerCase().includes(term);
		const matchesEstado =
			estadoFilter.value === 'Todas' ||
			(estadoFilter.value === 'Anuladas' ? venta.estado === 'anulada' : venta.estado !== 'anulada');
		return matchesQuery && matchesEstado;
	});
});

const totalFiltrado = computed(() =>
	filtered.value.reduce((total, venta) => total + (venta.estado === 'anulada' ? 0 : venta.totalVenta), 0),
);

function toggle(venta: VentaAdmin) {
	expandedId.value = expandedId.value === venta.id ? null : venta.id;
}

function estadoBadge(venta: VentaAdmin): { label: string; className: string } {
	if (venta.estado === 'anulada') return { label: 'Anulada', className: 'admin-badge-danger' };
	return { label: 'Realizada', className: 'admin-badge-success' };
}

async function anular(venta: VentaAdmin) {
	anulandoId.value = venta.id;
	error.value = '';

	try {
		const updated = await anularVentaAdmin(venta.id);
		ventas.value = ventas.value.map((item) =>
			item.id === venta.id
				? {
						...item,
						estado: updated.estado ?? 'anulada',
						fechaAnulacion: updated.fechaAnulacion ?? new Date().toISOString(),
						totalVenta: Number(updated.totalVenta ?? 0),
					}
				: item,
		);
		feedback.value = `Venta #${venta.codigo || venta.id} anulada y stock restaurado.`;
	} catch (anularError) {
		error.value = anularError instanceof Error ? anularError.message : 'No pudimos anular la venta.';
	} finally {
		anulandoId.value = null;
		confirmingId.value = null;
	}
}
</script>

<template>
	<div v-if="authorized" class="admin-sales admin-view">
		<div v-if="error" class="form-error" role="alert">{{ error }}</div>
		<div v-else-if="feedback" class="admin-feedback" role="status">{{ feedback }}</div>

		<div class="admin-toolbar">
			<div class="admin-search">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
					<circle cx="11" cy="11" r="8"></circle>
					<line x1="21" y1="21" x2="16.65" y2="16.65"></line>
				</svg>
				<input v-model="query" type="search" placeholder="Buscar por código o cliente..." aria-label="Buscar ventas" />
			</div>

			<div class="admin-toolbar-filters">
				<select v-model="estadoFilter" aria-label="Filtrar por estado">
					<option value="Todas">Todas</option>
					<option value="Realizadas">Realizadas</option>
					<option value="Anuladas">Anuladas</option>
				</select>
				<span class="admin-badge admin-badge-neutral">
					{{ filtered.length }} ventas · {{ formatPrice(totalFiltrado) }}
				</span>
			</div>
		</div>

		<div class="admin-card">
			<p class="sr-only" role="status">{{ loading ? 'Cargando ventas' : `${filtered.length} ventas` }}</p>

			<div v-if="loading" class="admin-skeleton-rows" aria-hidden="true">
				<span v-for="n in 5" :key="n" class="admin-skeleton admin-skeleton-row"></span>
			</div>

			<div v-else-if="!filtered.length" class="admin-empty">
				<span class="empty-state-icon" aria-hidden="true">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
						<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
						<path d="M14 2v6h6"></path>
						<path d="M9 15h6"></path>
						<path d="M9 11h2"></path>
					</svg>
				</span>
				<h3>No hay ventas que coincidan</h3>
				<p>Ajusta la búsqueda o el filtro de estado.</p>
			</div>

			<div v-else class="admin-table-wrap">
				<table class="admin-table">
					<thead>
						<tr>
							<th aria-label="Expandir"></th>
							<th>Código</th>
							<th>Cliente</th>
							<th>Fecha</th>
							<th>Método</th>
							<th>Total</th>
							<th>Estado</th>
							<th aria-label="Acciones"></th>
						</tr>
					</thead>
					<tbody>
						<template v-for="venta in filtered" :key="venta.id">
							<tr :class="{ 'admin-row-muted': venta.estado === 'anulada' }">
								<td>
									<button
										class="admin-table-toggle"
										:class="{ open: expandedId === venta.id }"
										type="button"
										:aria-expanded="expandedId === venta.id"
										:aria-label="`Ver detalle de la venta ${venta.codigo || venta.id}`"
										@click="toggle(venta)"
									>
										<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
											<path d="M6 9l6 6 6-6"></path>
										</svg>
									</button>
								</td>
								<td>
									<strong>#{{ venta.codigo || venta.id }}</strong>
								</td>
								<td>
									<div class="admin-table-product-info">
										<strong>{{ venta.nombreCliente || 'Cliente anónimo' }}</strong>
										<span v-if="venta.documento">Doc: {{ venta.documento }}</span>
									</div>
								</td>
								<td class="admin-numeric">{{ formatDateTime(venta.fechaCreacion) }}</td>
								<td>{{ venta.metodoPago }}</td>
								<td class="admin-numeric">{{ formatPrice(venta.totalVenta) }}</td>
								<td>
									<span class="admin-badge" :class="estadoBadge(venta).className">{{ estadoBadge(venta).label }}</span>
								</td>
								<td>
									<div class="admin-table-actions">
										<AdminConfirm
											v-if="confirmingId === venta.id"
											confirm-label="Sí, anular"
											busy-label="Anulando..."
											:busy="anulandoId === venta.id"
											@confirm="anular(venta)"
											@cancel="confirmingId = null"
										/>
										<button
											v-else
											class="admin-action admin-action-danger"
											type="button"
											:disabled="venta.estado === 'anulada'"
											:aria-label="`Anular la venta ${venta.codigo || venta.id}`"
											@click="confirmingId = venta.id"
										>
											<span>Anular</span>
										</button>
									</div>
								</td>
							</tr>
							<tr v-if="expandedId === venta.id" class="admin-sale-detail">
								<td colspan="8">
									<div class="admin-sale-detail-inner">
										<div>
											<h4>Productos</h4>
											<ul class="admin-sale-detail-list">
												<li v-for="detalle in venta.ventadetalles" :key="detalle.id">
													<span>{{ detalle.producto?.nombre || `Producto #${detalle.id}` }}</span>
													<span class="admin-numeric">
														{{ detalle.cantidad }} × {{ formatPrice(detalle.precioUnitario) }} =
														<strong>{{ formatPrice(detalle.subtotal) }}</strong>
													</span>
												</li>
												<li v-if="!venta.ventadetalles.length">
													<span>Sin detalles registrados.</span>
												</li>
											</ul>
										</div>
										<div>
											<h4>Información de pago</h4>
											<div class="admin-sale-meta">
												<span>Usuario: {{ venta.usuario?.nombreUsuario || '—' }}</span>
												<span
													>Monto pagado: {{ formatPrice(venta.montoPagado) }} · Cambio:
													{{ formatPrice(venta.cambio) }}</span
												>
												<span v-if="venta.fechaAnulacion">Anulada el {{ formatDateTime(venta.fechaAnulacion) }}</span>
											</div>
										</div>
									</div>
								</td>
							</tr>
						</template>
					</tbody>
				</table>
			</div>
		</div>
	</div>
</template>
