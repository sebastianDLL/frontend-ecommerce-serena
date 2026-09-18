<script setup lang="ts">
import { computed, ref, watch } from 'vue';
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
	<div class="modal-backdrop" @click.self="emit('close')" role="dialog" aria-modal="true">
		<article class="detail-modal">
			<button class="close-button" type="button" @click="emit('close')" aria-label="Cerrar ventana de detalle">
				×
			</button>
			<div class="detail-modal-media">
				<img :src="productImage(product)" :alt="product.nombre" @error="handleImageError" />
			</div>
			<div class="detail-modal-content">
				<div>
					<span class="eyebrow">{{ product.categoria?.nombre || 'Selección Exclusiva' }}</span>
					<h2>{{ product.nombre }}</h2>
					<p class="product-detail-desc">{{ product.descripcion }}</p>

					<div class="detail-modal-tags">
						<span class="tag-badge">🌱 100% Cera de Soya</span>
						<span class="tag-badge">🕯️ Mecha de Algodón</span>
						<span class="tag-badge">⏳ ~45 Horas de Calma</span>
					</div>
				</div>

				<div class="detail-modal-purchase">
					<div class="detail-modal-price-row">
						<span style="font-size: 13px; color: var(--serena-sage)">Precio unitario:</span>
						<strong>{{ formatPrice(product.precioUnitario) }}</strong>
					</div>

					<div class="detail-modal-actions">
						<div class="quantity-stepper" aria-label="Cantidad a comprar">
							<button type="button" :disabled="quantity <= 1" @click="decrement">−</button>
							<span>{{ quantity }}</span>
							<button type="button" :disabled="quantity >= maxQuantity" @click="increment">+</button>
						</div>

						<button class="primary-button" style="flex: 1" type="button" @click="confirmAdd">
							<span>Añadir al Carrito ({{ formatPrice(product.precioUnitario * quantity) }})</span>
						</button>
					</div>
				</div>
			</div>
		</article>
	</div>
</template>
