<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { clearSession, currentUser, hydrateSession, isAuthenticated } from '../../stores/session';

const mounted = ref(false);

onMounted(() => {
	hydrateSession();
	mounted.value = true;
});

const visible = computed(() => mounted.value && isAuthenticated.value);
const initial = computed(() => (currentUser.value?.nombreUsuario ?? '?').charAt(0));

function logout() {
	clearSession();
	window.location.href = '/admin/login';
}
</script>

<template>
	<div v-if="visible" class="admin-user">
		<div class="admin-user-avatar" aria-hidden="true">{{ initial }}</div>
		<div class="admin-user-info">
			<strong>{{ currentUser?.nombreUsuario }}</strong>
			<span>{{ currentUser?.rol?.nombre || 'Usuario' }}</span>
		</div>
		<button class="admin-button-ghost" type="button" @click="logout">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
				<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
				<path d="M16 17l5-5-5-5"></path>
				<path d="M21 12H9"></path>
			</svg>
			<span>Salir</span>
		</button>
	</div>
</template>
