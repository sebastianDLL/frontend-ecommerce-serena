<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { actualizarProductoAdmin, crearProductoAdmin, subirImagenesProducto } from '../../lib/admin-api';
import { imageUrl } from '../../lib/format';
import type { Categoria, Producto, ProductoInput } from '../../lib/types';

const props = defineProps<{ producto: Producto | null; categorias: Categoria[] }>();
const emit = defineEmits<{ close: []; saved: [producto: Producto] }>();

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_IMAGES = 10;

const form = ref({ nombre: '', descripcion: '', precioUnitario: '', stock: '', idCategoria: '' });
const existingImages = ref<string[]>([]);
const pendingFiles = ref<File[]>([]);
const saving = ref(false);
const error = ref('');
const fileInput = ref<HTMLInputElement | null>(null);

const isEditing = computed(() => Boolean(props.producto));
const title = computed(() => (isEditing.value ? 'Editar producto' : 'Nuevo producto'));

watch(
	() => props.producto,
	(producto) => {
		if (producto) {
			form.value = {
				nombre: producto.nombre,
				descripcion: producto.descripcion,
				precioUnitario: String(producto.precioUnitario),
				stock: String(producto.stock),
				idCategoria: producto.categoria ? String(producto.categoria.id) : '',
			};
			existingImages.value = [...(producto.imagenes ?? [])];
		} else {
			form.value = { nombre: '', descripcion: '', precioUnitario: '', stock: '', idCategoria: '' };
			existingImages.value = [];
		}
		pendingFiles.value = [];
		error.value = '';
	},
	{ immediate: true },
);

function validate(): string {
	const nombre = form.value.nombre.trim();
	const descripcion = form.value.descripcion.trim();
	const precio = Number(form.value.precioUnitario);
	const stock = Number(form.value.stock);

	if (nombre.length < 2 || nombre.length > 50) return 'El nombre debe tener entre 2 y 50 caracteres.';
	if (descripcion.length < 10 || descripcion.length > 200)
		return 'La descripción debe tener entre 10 y 200 caracteres.';
	if (!Number.isFinite(precio) || precio < 0) return 'El precio debe ser un número mayor o igual a 0.';
	if (!Number.isInteger(stock) || stock < 0) return 'El stock debe ser un número entero mayor o igual a 0.';
	if (!form.value.idCategoria) return 'Selecciona una categoría.';
	return '';
}

function handleFiles(event: Event) {
	const input = event.target as HTMLInputElement;
	const files = Array.from(input.files ?? []);
	input.value = '';

	for (const file of files) {
		if (!file.type.startsWith('image/')) {
			error.value = `"${file.name}" no es una imagen válida.`;
			continue;
		}
		if (file.size > MAX_IMAGE_SIZE) {
			error.value = `"${file.name}" supera los 5 MB permitidos.`;
			continue;
		}
		if (existingImages.value.length + pendingFiles.value.length >= MAX_IMAGES) {
			error.value = `Puedes tener hasta ${MAX_IMAGES} imágenes por producto.`;
			break;
		}
		pendingFiles.value.push(file);
	}
}

function removePending(index: number) {
	pendingFiles.value.splice(index, 1);
}

function removeExisting(index: number) {
	existingImages.value.splice(index, 1);
}

async function save() {
	error.value = validate();
	if (error.value) return;

	const input: ProductoInput = {
		nombre: form.value.nombre.trim(),
		descripcion: form.value.descripcion.trim(),
		precioUnitario: Number(form.value.precioUnitario),
		stock: Number(form.value.stock),
		idCategoria: Number(form.value.idCategoria),
	};

	saving.value = true;
	try {
		let producto: Producto;

		if (props.producto) {
			producto = await actualizarProductoAdmin(props.producto.id, { ...input, imagenes: existingImages.value });
		} else {
			producto = await crearProductoAdmin(input);
		}

		if (pendingFiles.value.length) {
			producto = await subirImagenesProducto(producto.id, pendingFiles.value);
		}

		const categoria = props.categorias.find((item) => item.id === Number(form.value.idCategoria)) ?? null;

		emit('saved', {
			...producto,
			categoria: producto.categoria ?? categoria,
			precioUnitario: Number(producto.precioUnitario ?? input.precioUnitario),
			stock: Number(producto.stock ?? input.stock),
			imagenes: producto.imagenes ?? existingImages.value,
		});
	} catch (saveError) {
		error.value = saveError instanceof Error ? saveError.message : 'No pudimos guardar el producto.';
	} finally {
		saving.value = false;
	}
}
</script>

<template>
	<div class="modal-backdrop" role="dialog" aria-modal="true" @click.self="emit('close')">
		<form class="admin-modal" @submit.prevent="save">
			<div class="admin-modal-head">
				<div>
					<h2>{{ title }}</h2>
					<p>
						{{
							isEditing
								? 'Actualiza los datos y guarda los cambios.'
								: 'Completa los datos. Podrás subir imágenes al guardar.'
						}}
					</p>
				</div>
				<button class="close-button" type="button" aria-label="Cerrar" @click="emit('close')">×</button>
			</div>

			<div v-if="error" class="form-error">{{ error }}</div>

			<div class="admin-form-grid">
				<div class="form-group admin-form-span">
					<label for="prod-nombre">Nombre *</label>
					<input
						id="prod-nombre"
						v-model="form.nombre"
						type="text"
						maxlength="50"
						required
						placeholder="Ej. Vela Calma"
					/>
				</div>

				<div class="form-group admin-form-span">
					<label for="prod-desc">Descripción *</label>
					<textarea
						id="prod-desc"
						v-model="form.descripcion"
						maxlength="200"
						required
						placeholder="Notas aromáticas, materiales y uso..."
					></textarea>
				</div>

				<div class="form-group">
					<label for="prod-precio">Precio unitario (Bs) *</label>
					<input id="prod-precio" v-model="form.precioUnitario" type="number" min="0" step="0.01" required />
				</div>

				<div class="form-group">
					<label for="prod-stock">Stock *</label>
					<input id="prod-stock" v-model="form.stock" type="number" min="0" step="1" required />
				</div>

				<div class="form-group admin-form-span">
					<label for="prod-categoria">Categoría *</label>
					<select id="prod-categoria" v-model="form.idCategoria" required>
						<option value="" disabled>Selecciona una categoría</option>
						<option v-for="categoria in categorias" :key="categoria.id" :value="String(categoria.id)">
							{{ categoria.nombre }}
						</option>
					</select>
				</div>

				<div class="form-group admin-form-span">
					<label>Imágenes</label>
					<div class="admin-images">
						<div v-for="(imagen, index) in existingImages" :key="imagen" class="admin-image-item">
							<img :src="imageUrl(imagen)" :alt="`Imagen ${index + 1} de ${form.nombre}`" />
							<button
								class="admin-image-remove"
								type="button"
								:aria-label="`Quitar imagen ${index + 1}`"
								@click="removeExisting(index)"
							>
								×
							</button>
						</div>

						<div v-for="(file, index) in pendingFiles" :key="file.name + index" class="admin-image-item">
							<div class="admin-upload-zone" style="cursor: default">
								<span>{{ file.name }}</span>
								<button type="button" style="text-decoration: underline" @click="removePending(index)">Quitar</button>
							</div>
						</div>

						<label v-if="existingImages.length + pendingFiles.length < MAX_IMAGES" class="admin-upload-zone">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
								<path d="M12 5v14"></path>
								<path d="M5 12h14"></path>
							</svg>
							<span>Subir imagen</span>
							<input ref="fileInput" type="file" accept="image/*" multiple @change="handleFiles" />
						</label>
					</div>
					<p class="admin-form-hint">Hasta 10 imágenes, 5 MB por archivo. Las imágenes nuevas se suben al guardar.</p>
				</div>
			</div>

			<div class="admin-form-actions">
				<button class="secondary-button" type="button" @click="emit('close')">Cancelar</button>
				<button class="primary-button" type="submit" :disabled="saving">
					<span v-if="saving">Guardando...</span>
					<span v-else>{{ isEditing ? 'Guardar cambios' : 'Crear producto' }}</span>
					<span v-if="saving" class="button-loader" aria-hidden="true"></span>
				</button>
			</div>
		</form>
	</div>
</template>
