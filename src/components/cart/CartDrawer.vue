<script setup lang="ts">
import {
	addToCart,
	cartCount,
	cartStore,
	cartTotal,
	closeCartDrawer,
	decreaseCartLine,
	removeCartLine,
} from '../../stores/cart';
import { showToast } from '../../stores/toast';
import { formatPrice, handleImageError, productImage } from '../../lib/format';
import type { Producto } from '../../lib/types';

const emit = defineEmits<{ checkout: [] }>();

function addLine(product: Producto) {
	const result = addToCart(product, 1);
	if (!result.added) showToast(`No hay más stock disponible de "${product.nombre}"`);
}
</script>

<template>
	<div class="cart-backdrop" :class="{ open: cartStore.drawerOpen }" @click="closeCartDrawer" aria-hidden="true"></div>

	<aside
		class="cart-drawer"
		:class="{ open: cartStore.drawerOpen }"
		role="dialog"
		aria-label="Carrito de compras"
		:aria-modal="cartStore.drawerOpen"
	>
		<div class="drawer-heading">
			<div>
				<span class="eyebrow">Tu compra</span>
				<h2>
					Carrito
					<small>({{ cartCount }} {{ cartCount === 1 ? 'artículo' : 'artículos' }})</small>
				</h2>
			</div>
			<button class="close-button" type="button" @click="closeCartDrawer" aria-label="Cerrar carrito de compras">
				×
			</button>
		</div>

		<div v-if="!cartStore.lines.length" class="empty-state cart-empty">
			<span class="empty-state-icon" aria-hidden="true">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
					<path
						d="M12 3c1.5 2.8 3.9 4.3 3.9 7.6A3.9 3.9 0 0 1 12 14.5a3.9 3.9 0 0 1-3.9-3.9C8.1 7.3 10.5 5.8 12 3z"
					></path>
					<path d="M12 14.5V21"></path>
				</svg>
			</span>
			<h3>Tu carrito está esperando</h3>
			<p>Aún no has agregado velas aromáticas a tu selección.</p>
			<button class="primary-button" type="button" @click="closeCartDrawer">Ver catálogo de velas</button>
		</div>

		<div v-else class="cart-lines">
			<div v-for="line in cartStore.lines" :key="line.product.id" class="cart-line">
				<img :src="productImage(line.product)" :alt="line.product.nombre" @error="handleImageError" />
				<div class="cart-line-info">
					<div>
						<h3>{{ line.product.nombre }}</h3>
						<p class="cart-line-price">{{ formatPrice(line.product.precioUnitario) }} c/u</p>
					</div>
					<div class="cart-line-controls">
						<div class="quantity-stepper">
							<button type="button" @click="decreaseCartLine(line.product.id)" aria-label="Reducir cantidad">−</button>
							<span>{{ line.quantity }}</span>
							<button type="button" @click="addLine(line.product)" aria-label="Aumentar cantidad">+</button>
						</div>
						<button type="button" class="cart-remove-item" @click="removeCartLine(line.product.id)">Quitar</button>
					</div>
				</div>
			</div>
		</div>

		<div v-if="cartStore.lines.length" class="cart-summary">
			<div class="cart-summary-row">
				<span>Artículos</span>
				<span>{{ cartCount }}</span>
			</div>
			<div class="cart-summary-row total">
				<span>Total a pagar</span>
				<strong>{{ formatPrice(cartTotal) }}</strong>
			</div>
			<p class="shipping-perk">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
					<path d="M12 21c-4.4-2.4-7-5.4-7-8.8a7 7 0 0 1 14 0c0 3.4-2.6 6.4-7 8.8z"></path>
					<path d="M12 3v5"></path>
				</svg>
				<span>Empaque artesanal seguro incluido</span>
			</p>
			<button id="checkout-trigger-btn" class="primary-button" type="button" @click="emit('checkout')">
				<span>Proceder al pago</span>
				<span>→</span>
			</button>
		</div>
	</aside>
</template>
