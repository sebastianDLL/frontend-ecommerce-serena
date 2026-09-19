<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
	actualizarCategoriaAdmin,
	crearCategoriaAdmin,
	eliminarCategoriaAdmin,
	fetchCategoriasAdmin,
} from '../../lib/admin-api';
import { useAdminGuard } from '../../composables/useAdminGuard';
import type { Categoria } from '../../lib/types';

const { authorized } = useAdminGuard();

const categorias = ref<Categoria[]>([]);
const loading = ref(false);
const error = ref('');
const feedback = ref('');

const newName = ref('');
const creating = ref(false);

const editingId = ref<number | null>(null);
const editingName = ref('');
const savingId = ref<number | null>(null);
const deletingId = ref<number | null>(null);

async function load() {
	loading.value = true;
	error.value = '';

	try {
		categorias.value = await fetchCategoriasAdmin();
	} catch (loadError) {
		error.value = loadError instanceof Error ? loadError.message : 'No pudimos cargar las categorías.';
	} finally {
		loading.value = false;
	}
}

watch(
	authorized,
	(value) => {
		if (value && !categorias.value.length && !loading.value) load();
	},
	{ immediate: true },
);

const sorted = computed(() => [...categorias.value].sort((a, b) => a.nombre.localeCompare(b.nombre)));

async function create() {
	const nombre = newName.value.trim();
	error.value = '';
	feedback.value = '';

	if (nombre.length < 2 || nombre.length > 50) {
		error.value = 'El nombre debe tener entre 2 y 50 caracteres.';
		return;
	}

	creating.value = true;
	try {
		const categoria = await crearCategoriaAdmin({ nombre });
		categorias.value = [...categorias.value, categoria];
		newName.value = '';
		feedback.value = `Categoría "${categoria.nombre}" creada.`;
	} catch (createError) {
		error.value = createError instanceof Error ? createError.message : 'No pudimos crear la categoría.';
	} finally {
		creating.value = false;
	}
}

function startEdit(categoria: Categoria) {
	editingId.value = categoria.id;
	editingName.value = categoria.nombre;
	error.value = '';
	feedback.value = '';
}

function cancelEdit() {
	editingId.value = null;
	editingName.value = '';
}

async function saveEdit(categoria: Categoria) {
	const nombre = editingName.value.trim();

	if (nombre.length < 2 || nombre.length > 50) {
		error.value = 'El nombre debe tener entre 2 y 50 caracteres.';
		return;
	}

	savingId.value = categoria.id;
	error.value = '';

	try {
		const updated = await actualizarCategoriaAdmin(categoria.id, { nombre });
		categorias.value = categorias.value.map((item) => (item.id === updated.id ? updated : item));
		feedback.value = `Categoría actualizada a "${updated.nombre}".`;
		cancelEdit();
	} catch (updateError) {
		error.value = updateError instanceof Error ? updateError.message : 'No pudimos actualizar la categoría.';
	} finally {
		savingId.value = null;
	}
}

async function remove(categoria: Categoria) {
	const confirmed = window.confirm(
		`¿Eliminar la categoría "${categoria.nombre}"? Los productos que la usan conservarán su referencia hasta que se reasignen.`,
	);
	if (!confirmed) return;

	deletingId.value = categoria.id;
	error.value = '';

	try {
		await eliminarCategoriaAdmin(categoria.id);
		categorias.value = categorias.value.filter((item) => item.id !== categoria.id);
		feedback.value = `Categoría "${categoria.nombre}" eliminada.`;
	} catch (deleteError) {
		error.value = deleteError instanceof Error ? deleteError.message : 'No pudimos eliminar la categoría.';
	} finally {
		deletingId.value = null;
	}
}
</script>

<template>
	<div v-if="authorized" class="admin-categories">
		<div v-if="error" class="form-error">{{ error }}</div>
		<div v-else-if="feedback" class="admin-feedback">{{ feedback }}</div>

		<div class="admin-card">
			<div class="admin-card-head">
				<h2>Nueva categoría</h2>
			</div>
			<div class="admin-card-body">
				<form class="admin-category-form" @submit.prevent="create">
					<input
						v-model="newName"
						type="text"
						maxlength="50"
						placeholder="Ej. Aromáticas"
						aria-label="Nombre de la categoría"
					/>
					<button class="primary-button" type="submit" :disabled="creating">
						<span>{{ creating ? 'Creando...' : 'Crear categoría' }}</span>
					</button>
				</form>
			</div>
		</div>

		<div class="admin-card">
			<div class="admin-card-head">
				<h2>Categorías registradas</h2>
				<span class="admin-badge admin-badge-neutral">{{ categorias.length }}</span>
			</div>

			<div v-if="loading" class="admin-loading">Cargando categorías...</div>

			<div v-else-if="!sorted.length" class="admin-empty">
				<h3>Todavía no hay categorías</h3>
				<p>Crea la primera para organizar el catálogo.</p>
			</div>

			<div v-else class="admin-table-wrap">
				<table class="admin-table">
					<thead>
						<tr>
							<th>Nombre</th>
							<th aria-label="Acciones"></th>
						</tr>
					</thead>
					<tbody>
						<tr v-for="categoria in sorted" :key="categoria.id">
							<td>
								<input
									v-if="editingId === categoria.id"
									v-model="editingName"
									class="admin-inline-input"
									type="text"
									maxlength="50"
									:aria-label="`Editar nombre de ${categoria.nombre}`"
									@keydown.enter.prevent="saveEdit(categoria)"
									@keydown.esc="cancelEdit"
								/>
								<strong v-else>{{ categoria.nombre }}</strong>
							</td>
							<td>
								<div class="admin-table-actions">
									<template v-if="editingId === categoria.id">
										<button
											class="admin-action"
											type="button"
											:disabled="savingId === categoria.id"
											@click="saveEdit(categoria)"
										>
											{{ savingId === categoria.id ? 'Guardando...' : 'Guardar' }}
										</button>
										<button class="admin-action" type="button" @click="cancelEdit">Cancelar</button>
									</template>
									<template v-else>
										<button class="admin-action" type="button" @click="startEdit(categoria)">
											<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
												<path d="M12 20h9"></path>
												<path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"></path>
											</svg>
											<span>Editar</span>
										</button>
										<button
											class="admin-action admin-action-danger"
											type="button"
											:disabled="deletingId === categoria.id"
											@click="remove(categoria)"
										>
											<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
												<path d="M3 6h18"></path>
												<path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"></path>
												<path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
											</svg>
											<span>{{ deletingId === categoria.id ? 'Eliminando...' : 'Eliminar' }}</span>
										</button>
									</template>
								</div>
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>
	</div>
</template>
