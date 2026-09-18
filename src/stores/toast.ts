import { ref } from 'vue';

export const toastMessage = ref<string | null>(null);
let timeout: ReturnType<typeof setTimeout> | null = null;

export function showToast(text: string, duration = 3500) {
	toastMessage.value = text;
	if (timeout) clearTimeout(timeout);
	timeout = setTimeout(() => {
		toastMessage.value = null;
		timeout = null;
	}, duration);
}

export function hideToast() {
	if (timeout) {
		clearTimeout(timeout);
		timeout = null;
	}
	toastMessage.value = null;
}
