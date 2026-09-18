<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useScrollLock } from '../../composables/useScrollLock';
import { formatPrice, handleImageError, productImage } from '../../lib/format';
import type { Producto } from '../../lib/types';

const props = defineProps<{ product: Producto }>();
const emit = defineEmits<{ close: []; add: [quantity: number] }>();

const quantity = ref(1);
const maxQuantity = computed(() => Math.max(1, Number(props.product.stock) || 1));

watch(
	() => props.product.id,
	() => {
		quantity.value = 1;
	},
);

watch(maxQuantity, (max) => {
	if (quantity.value > max) quantity.value = max;
});

useScrollLock();

function decrement() {
	if (quantity.value > 1) quantity.value -= 1;
}

function increment() {
	if (quantity.value < maxQuantity.value) quantity.value += 1;
}

function confirmAdd() {
	emit('add', quantity.value);
}
</script>

<template>
	<div class="modal-backdrop" @click.self="emit('close')" role="dialog" aria-modal="true" :aria-label="product.nombre">
		<article class="detail-modal">
			<button class="close-button" type="button" @click="emit('close')" aria-label="Cerrar ventana de detalle">
				×
			</button>
			<div class="detail-modal-media">
				<img :src="productImage(product)" :alt="product.nombre" @error="handleImageError" />
			</div>
			<div class="detail-modal-content">
				<div>
					<span class="eyebrow">{{ product.categoria?.nombre || 'Selección exclusiva' }}</span>
					<h2>{{ product.nombre }}</h2>
					<p class="product-detail-desc">{{ product.descripcion }}</p>

					<div class="detail-modal-tags">
						<span class="tag-badge">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
								<path d="M12 21c-4.4-2.4-7-5.4-7-8.8a7 7 0 0 1 14 0c0 3.4-2.6 6.4-7 8.8z"></path>
								<path d="M12 3v5"></path>
							</svg>
							100% cera de soya
						</span>
						<span class="tag-badge">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
								<path
									d="M12 3c1.5 2.8 3.9 4.3 3.9 7.6A3.9 3.9 0 0 1 12 14.5a3.9 3.9 0 0 1-3.9-3.9C8.1 7.3 10.5 5.8 12 3z"
								></path>
								<path d="M12 14.5V21"></path>
							</svg>
							Mecha de algodón
						</span>
						<span class="tag-badge">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
								<circle cx="12" cy="12" r="8.5"></circle>
								<path d="M12 7.5V12l3 2"></path>
							</svg>
							~45 horas de luz
						</span>
					</div>
				</div>

				<div class="detail-modal-purchase">
					<div class="detail-modal-price-row">
						<span class="detail-modal-price-label">Precio unitario</span>
						<strong>{{ formatPrice(product.precioUnitario) }}</strong>
					</div>

					<div class="detail-modal-actions">
						<div class="quantity-stepper" aria-label="Cantidad a comprar">
							<button type="button" :disabled="quantity <= 1" @click="decrement" aria-label="Quitar una unidad">
								−
							</button>
							<span aria-live="polite">{{ quantity }}</span>
							<button
								type="button"
								:disabled="quantity >= maxQuantity"
								@click="increment"
								aria-label="Añadir una unidad"
							>
								+
							</button>
						</div>

						<button class="primary-button detail-modal-confirm" type="button" @click="confirmAdd">
							<span>Añadir al carrito ({{ formatPrice(product.precioUnitario * quantity) }})</span>
						</button>
					</div>
				</div>
			</div>
		</article>
	</div>
</template>
