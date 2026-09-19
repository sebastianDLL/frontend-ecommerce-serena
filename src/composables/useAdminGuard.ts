import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { hydrateSession, isAuthenticated } from '../stores/session';

export function redirectToLogin() {
	if (typeof window === 'undefined') return;
	if (window.location.pathname === '/admin/login') return;
	const redirect = `${window.location.pathname}${window.location.search}`;
	window.location.replace(`/admin/login?redirect=${encodeURIComponent(redirect)}`);
}

export function getSafeRedirect(): string {
	if (typeof window === 'undefined') return '/admin';
	const redirect = new URLSearchParams(window.location.search).get('redirect');
	if (redirect && redirect.startsWith('/admin') && !redirect.startsWith('/admin/login')) return redirect;
	return '/admin';
}

export function useAdminGuard() {
	const ready = ref(false);
	let stopWatch: (() => void) | null = null;

	onMounted(() => {
		hydrateSession();
		ready.value = true;

		if (!isAuthenticated.value) {
			redirectToLogin();
			return;
		}

		stopWatch = watch(isAuthenticated, (value) => {
			if (!value) redirectToLogin();
		});
	});

	onBeforeUnmount(() => {
		stopWatch?.();
		stopWatch = null;
	});

	const authorized = computed(() => ready.value && isAuthenticated.value);

	return { ready, authorized };
}
