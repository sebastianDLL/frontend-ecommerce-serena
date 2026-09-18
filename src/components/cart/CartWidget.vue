<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { cartCount, cartStore, closeCartDrawer, hydrateCart, openCartDrawer } from '../../stores/cart';
import CartDrawer from './CartDrawer.vue';
import CheckoutModal from './CheckoutModal.vue';
import SuccessModal from './SuccessModal.vue';
import ToastNotification from './ToastNotification.vue';

const checkoutOpen = ref(false);
const orderCode = ref<string | null>(null);
const customerName = ref('');
const mounted = ref(false);

function handleSuccess(code: string, name: string) {
	orderCode.value = code;
	customerName.value = name;
	checkoutOpen.value = false;
}

function closeSuccess() {
	orderCode.value = null;
}

function handleCheckout() {
	closeCartDrawer();
	checkoutOpen.value = true;
}

function handleKeyDown(event: KeyboardEvent) {
	if (event.key !== 'Escape') return;
	if (orderCode.value) {
		closeSuccess();
		return;
	}
	if (checkoutOpen.value) {
		checkoutOpen.value = false;
		return;
	}
	if (cartStore.drawerOpen) closeCartDrawer();
}

onMounted(() => {
	hydrateCart();
	mounted.value = true;
	window.addEventListener('keydown', handleKeyDown);
});

onBeforeUnmount(() => {
	window.removeEventListener('keydown', handleKeyDown);
});
</script>

<template>
	<button class="cart-button" type="button" @click="openCartDrawer" aria-label="Abrir carrito de compras">
		<svg class="cart-icon" viewBox="0 0 24 24">
			<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
			<line x1="3" y1="6" x2="21" y2="6"></line>
			<path d="M16 10a4 4 0 0 1-8 0"></path>
		</svg>
		<span>Carrito</span>
		<strong>{{ cartCount }}</strong>
	</button>

	<Teleport v-if="mounted" to="body">
		<CartDrawer @checkout="handleCheckout" />
		<CheckoutModal :open="checkoutOpen" @close="checkoutOpen = false" @success="handleSuccess" />
		<SuccessModal v-if="orderCode" :code="orderCode" :customer-name="customerName" @close="closeSuccess" />
		<ToastNotification />
	</Teleport>
</template>
