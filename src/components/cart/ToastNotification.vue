<script setup lang="ts">
import { hideToast, toastMessage } from '../../stores/toast';
import { openCartDrawer } from '../../stores/cart';

function viewCart() {
	hideToast();
	openCartDrawer();
}
</script>

<template>
	<aside v-if="toastMessage" class="toast-notification" role="status" aria-live="polite">
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
			<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
			<polyline points="22 4 12 14.01 9 11.01"></polyline>
		</svg>
		<p>{{ toastMessage }}</p>
		<button type="button" @click="viewCart">Ver Carrito</button>
	</aside>
</template>
