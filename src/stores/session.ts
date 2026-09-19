import { computed, reactive } from 'vue';
import type { UsuarioSesion } from '../lib/types';

const STORAGE_KEY = 'serena:session:v1';

interface SessionState {
	token: string | null;
	usuario: UsuarioSesion | null;
}

const state = reactive<SessionState>({ token: null, usuario: null });
let hydrated = false;

export function hydrateSession() {
	if (hydrated || typeof localStorage === 'undefined') return;
	hydrated = true;

	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return;
		const parsed = JSON.parse(raw) as Partial<SessionState>;
		if (typeof parsed?.token === 'string' && parsed.token) {
			state.token = parsed.token;
			state.usuario = parsed.usuario ?? null;
		}
	} catch {
		localStorage.removeItem(STORAGE_KEY);
	}
}

export function saveSession(token: string, usuario: UsuarioSesion) {
	state.token = token;
	state.usuario = usuario;
	if (typeof localStorage === 'undefined') return;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, usuario }));
	} catch {
		// Almacenamiento no disponible: la sesión vive solo en memoria.
	}
}

export function clearSession() {
	state.token = null;
	state.usuario = null;
	if (typeof localStorage === 'undefined') return;
	localStorage.removeItem(STORAGE_KEY);
}

export const isAuthenticated = computed(() => Boolean(state.token));
export const currentUser = computed(() => state.usuario);
export const sessionStore = state;
