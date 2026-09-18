import { onBeforeUnmount, onMounted, watch, type Ref } from 'vue';

const holders = new Set<symbol>();

function applyLock() {
	if (typeof document === 'undefined' || !document.body) return;
	document.body.style.overflow = holders.size ? 'hidden' : '';
}

function lock(token: symbol) {
	holders.add(token);
	applyLock();
}

function unlock(token: symbol) {
	holders.delete(token);
	applyLock();
}

export function useScrollLock(active?: Ref<boolean>) {
	const token = Symbol('serena-scroll-lock');

	if (active) {
		watch(
			active,
			(open) => {
				if (open) lock(token);
				else unlock(token);
			},
			{ immediate: true },
		);
	} else {
		onMounted(() => lock(token));
	}

	onBeforeUnmount(() => unlock(token));
}
