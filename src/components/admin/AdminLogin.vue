<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ApiError } from '../../lib/api';
import { loginAdmin } from '../../lib/admin-api';
import { getSafeRedirect } from '../../composables/useAdminGuard';
import { hydrateSession, isAuthenticated, saveSession } from '../../stores/session';

const form = reactive({ nombreUsuario: '', clave: '' });
const error = ref('');
const submitting = ref(false);

onMounted(() => {
	hydrateSession();
	if (isAuthenticated.value) window.location.replace(getSafeRedirect());
});

async function submit() {
	error.value = '';

	if (!form.nombreUsuario.trim() || !form.clave) {
		error.value = 'Escribe tu usuario y contraseña.';
		return;
	}

	submitting.value = true;
	try {
		const { token, usuario } = await loginAdmin(form.nombreUsuario.trim(), form.clave);
		saveSession(token, usuario);
		window.location.replace(getSafeRedirect());
	} catch (loginError) {
		if (loginError instanceof ApiError && (loginError.status === 401 || loginError.status === 404)) {
			error.value = 'Usuario o contraseña incorrectos.';
		} else {
			error.value = loginError instanceof Error ? loginError.message : 'No pudimos iniciar sesión.';
		}
	} finally {
		submitting.value = false;
	}
}
</script>

<template>
	<div class="admin-login-page">
		<div class="admin-login-card">
			<div class="admin-login-brand">
				<img src="/Original_1-8.png" alt="SERENA" />
				<h1>Panel de administración</h1>
				<p>Ingresa con tu cuenta para gestionar la tienda.</p>
			</div>

			<form class="admin-login-form" @submit.prevent="submit">
				<div v-if="error" class="form-error" role="alert">{{ error }}</div>

				<div class="form-group">
					<label for="admin-user">Usuario</label>
					<input
						id="admin-user"
						v-model="form.nombreUsuario"
						type="text"
						autocomplete="username"
						required
						placeholder="Tu nombre de usuario"
					/>
				</div>

				<div class="form-group">
					<label for="admin-pass">Contraseña</label>
					<input
						id="admin-pass"
						v-model="form.clave"
						type="password"
						autocomplete="current-password"
						required
						placeholder="••••••••"
					/>
				</div>

				<button class="primary-button" type="submit" :disabled="submitting">
					<span v-if="submitting">Ingresando...</span>
					<span v-else>Ingresar al panel</span>
					<span v-if="submitting" class="button-loader" aria-hidden="true"></span>
					<svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
						<path d="M5 12h14"></path>
						<path d="M12 5l7 7-7 7"></path>
					</svg>
				</button>
			</form>

			<p class="admin-login-footer">
				<a href="/">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
						<path d="M19 12H5"></path>
						<path d="M12 19l-7-7 7-7"></path>
					</svg>
					Volver a la tienda
				</a>
			</p>
		</div>
	</div>
</template>
