<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';

interface Product {
	id: number;
	nombre: string;
	descripcion: string;
	precioUnitario: number;
	stock: number;
	imagenes?: string[];
	categoria?: { id: number; nombre: string };
}

interface CartLine {
	product: Product;
	quantity: number;
}

const apiUrl = import.meta.env.PUBLIC_API_URL || 'http://localhost:3000/api/v1';

// Imágenes de alta resolución seleccionadas según la identidad visual de SERENA
const imageFallbacks = [
	'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=900&q=80', // Vela ámbar en madera
	'https://images.unsplash.com/photo-1608181831718-c9d7a2b8f5b1?auto=format&fit=crop&w=900&q=80', // Vela blanca botánica
	'https://images.unsplash.com/photo-1602523961358-f9f03dd557db?auto=format&fit=crop&w=900&q=80', // Vela vaso ámbar cálido
	'https://images.unsplash.com/photo-1603905179139-db12ab535b1d?auto=format&fit=crop&w=900&q=80', // Vela ritual zen
	'https://images.unsplash.com/photo-1572726729986-508ef48d8b9f?auto=format&fit=crop&w=900&q=80', // Vela cera de soya
	'https://images.unsplash.com/photo-1543257580-7269da773bf5?auto=format&fit=crop&w=900&q=80', // Vela relajante aroma
];

const demoProducts: Product[] = [
	{
		id: 1,
		nombre: 'Vela Calma',
		descripcion: 'Lavanda silvestre, salvia blanca y cedro cálido. Ideal para desconectar al caer la tarde.',
		precioUnitario: 48000,
		stock: 12,
		categoria: { id: 1, nombre: 'Aromáticas' },
		imagenes: [imageFallbacks[0]],
	},
	{
		id: 2,
		nombre: 'Vela Alba',
		descripcion: 'Flor de azahar, bergamota fresca y un toque de lino limpio para comenzar el día con energía serena.',
		precioUnitario: 52000,
		stock: 8,
		categoria: { id: 1, nombre: 'Aromáticas' },
		imagenes: [imageFallbacks[1]],
	},
	{
		id: 3,
		nombre: 'Vela Ámbar & Madera',
		descripcion: 'Notas profundas de sándalo oriental, ámbar resinoso y vainilla bourbon para noches acogedoras.',
		precioUnitario: 56000,
		stock: 14,
		categoria: { id: 2, nombre: 'Colección Exclusiva' },
		imagenes: [imageFallbacks[2]],
	},
	{
		id: 4,
		nombre: 'Vela Ritual Sagrado',
		descripcion: 'Palo santo ancestral, mirra y eucalipto para momentos de presencia, meditación y limpieza energética.',
		precioUnitario: 45000,
		stock: 6,
		categoria: { id: 3, nombre: 'Rituales' },
		imagenes: [imageFallbacks[3]],
	},
	{
		id: 5,
		nombre: 'Vela Vainilla & Canela',
		descripcion: 'Fragancia dulce y reconfortante con canela en rama de Ceilán y vainilla natural de Madagascar.',
		precioUnitario: 49000,
		stock: 15,
		categoria: { id: 1, nombre: 'Aromáticas' },
		imagenes: [imageFallbacks[4]],
	},
	{
		id: 6,
		nombre: 'Set Trío SERENA',
		descripcion: 'Caja de regalo artesanal con tres mini velas aromáticas: Calma, Alba y Ámbar en frascos reutilizables.',
		precioUnitario: 95000,
		stock: 5,
		categoria: { id: 4, nombre: 'Edición Regalo' },
		imagenes: [imageFallbacks[5]],
	},
];

// Estado reactivo
const products = ref<Product[]>([]);
const query = ref('');
const activeCategory = ref('Todos');
const cart = ref<CartLine[]>([]);
const cartOpen = ref(false);
const selectedProduct = ref<Product | null>(null);
const detailQuantity = ref(1);
const loading = ref(true);
const usingDemo = ref(false);
const checkoutOpen = ref(false);

// Formulario de Checkout
const customerName = ref('');
const customerPhone = ref('');
const customerAddress = ref('');
const customerDocument = ref('');
const paymentMethod = ref<'transferencia' | 'qr'>('transferencia');
const orderNotes = ref('');
const checkoutError = ref('');
const orderCode = ref<string | null>(null);
const submittingOrder = ref(false);

// Estado del flujo QR
const qrCodigo = ref<string | null>(null);
const qrUrl = ref<string | null>(null);
const qrEstado = ref<'idle' | 'generando' | 'pendiente' | 'aprobado' | 'error'>('idle');
const qrError = ref('');
let qrPollingInterval: ReturnType<typeof setInterval> | null = null;

function detenerPollingQr() {
	if (qrPollingInterval) {
		clearInterval(qrPollingInterval);
		qrPollingInterval = null;
	}
}

function resetQr() {
	detenerPollingQr();
	qrCodigo.value = null;
	qrUrl.value = null;
	qrEstado.value = 'idle';
	qrError.value = '';
}

async function generarQr(payload: Record<string, unknown>) {
	if (!customerName.value.trim()) {
		checkoutError.value = 'Escribe tu nombre antes de generar el QR.';
		return;
	}
	if (!customerPhone.value.trim()) {
		checkoutError.value = 'Escribe tu teléfono antes de generar el QR.';
		return;
	}
	checkoutError.value = '';
	qrEstado.value = 'generando';
	try {
		const res = await fetch(`${apiUrl}/pagos/qr/generar`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload),
		});
		if (!res.ok) throw new Error('No se pudo generar el QR');
		const data = await res.json();
		qrCodigo.value = data.codigo;
		qrUrl.value = data.qrUrl;
		qrEstado.value = 'pendiente';
		// Iniciar polling de verificación cada 2 segundos
		qrPollingInterval = setInterval(async () => {
			try {
				const vRes = await fetch(`${apiUrl}/pagos/qr/${qrCodigo.value}/verificar`);
				const vData = await vRes.json();
				if (vData.estado === 'aprobado') {
					detenerPollingQr();
					if (!vData.venta) {
						qrEstado.value = 'error';
						qrError.value = 'El pago fue aprobado, pero la venta aún no está disponible. Intenta consultar nuevamente.';
						return;
					}
					qrEstado.value = 'aprobado';
					orderCode.value = vData.venta.codigo || String(vData.venta.id);
					cart.value = [];
					checkoutOpen.value = false;
					resetQr();
				} else if (vData.estado === 'expirado') {
					detenerPollingQr();
					qrEstado.value = 'error';
					qrError.value = 'El QR expiró. Por favor genera uno nuevo.';
				} else if (vData.estado === 'rechazado') {
					detenerPollingQr();
					qrEstado.value = 'error';
					qrError.value = 'No se pudo completar la venta. Revisa el stock e intenta nuevamente.';
				}
			} catch {
				// ignorar errores de red en polling
			}
		}, 2000);
	} catch {
		qrEstado.value = 'error';
		qrError.value = 'No se pudo generar el QR. Verifica la conexión.';
	}
}

// Notificación Toast
const toastMessage = ref<string | null>(null);
let toastTimeout: ReturnType<typeof setTimeout> | null = null;

function showToast(message: string) {
	toastMessage.value = message;
	if (toastTimeout) clearTimeout(toastTimeout);
	toastTimeout = setTimeout(() => {
		toastMessage.value = null;
	}, 3500);
}

// Carga inicial
onMounted(async () => {
	try {
		const response = await fetch(`${apiUrl}/productos/stock`);
		if (!response.ok) throw new Error('No se pudo consultar el catálogo');
		const data = await response.json();
		products.value = data.length ? data : demoProducts;
		usingDemo.value = !data.length;
	} catch {
		products.value = demoProducts;
		usingDemo.value = true;
	} finally {
		loading.value = false;
	}

	// Cerrar modales con tecla Escape
	const handleKeyDown = (e: KeyboardEvent) => {
		if (e.key === 'Escape') {
			cartOpen.value = false;
			selectedProduct.value = null;
			if (checkoutOpen.value) {
				checkoutOpen.value = false;
				resetQr();
			}
			orderCode.value = null;
		}
	};
	window.addEventListener('keydown', handleKeyDown);
	onUnmounted(() => {
		window.removeEventListener('keydown', handleKeyDown);
		detenerPollingQr();
	});
});

// Categorías dinámicas
const categories = computed(() => [
	'Todos',
	...new Set(products.value.map((product) => product.categoria?.nombre).filter(Boolean) as string[]),
]);

// Productos filtrados
const filteredProducts = computed(() =>
	products.value.filter((product) => {
		const searchTarget = `${product.nombre} ${product.descripcion} ${product.categoria?.nombre || ''}`.toLowerCase();
		const matchesQuery = searchTarget.includes(query.value.trim().toLowerCase());
		const matchesCategory = activeCategory.value === 'Todos' || product.categoria?.nombre === activeCategory.value;
		return matchesQuery && matchesCategory;
	}),
);

// Resumen de Carrito
const cartCount = computed(() => cart.value.reduce((total, line) => total + line.quantity, 0));
const cartTotal = computed(() => cart.value.reduce((total, line) => total + line.product.precioUnitario * line.quantity, 0));

// Helpers de Imágenes y Formato
function imageUrl(image: string, index = 0) {
	if (!image) return imageFallbacks[index % imageFallbacks.length];
	if (image.startsWith('http') || image.startsWith('data:')) return image;
	const backendUrl = apiUrl.replace(/\/api\/v1\/?$/, '');
	const normalized = image.startsWith('/') ? image : `/${image}`;
	return `${backendUrl}${normalized}`;
}

function productImage(product: Product, index = 0) {
	const image = product.imagenes?.[0];
	if (!image) return imageFallbacks[index % imageFallbacks.length];
	return imageUrl(image, index);
}

function handleImageError(event: Event, index = 0) {
	const image = event.currentTarget as HTMLImageElement;
	if (image.dataset.fallbackApplied) return;
	image.dataset.fallbackApplied = 'true';
	image.src = imageFallbacks[index % imageFallbacks.length];
}

function formatPrice(value: number) {
	return new Intl.NumberFormat('es-BO', {
		style: 'currency',
		currency: 'BOB',
		maximumFractionDigits: 0,
	}).format(Number(value));
}

// Operaciones del Carrito
function addToCart(product: Product, quantity = 1, openDrawer = false) {
	const line = cart.value.find((item) => item.product.id === product.id);
	if (line) {
		line.quantity += quantity;
	} else {
		cart.value.push({ product, quantity });
	}

	showToast(`"${product.nombre}" añadido al carrito`);

	if (openDrawer) {
		cartOpen.value = true;
	}
}

function removeFromCart(productId: number) {
	const line = cart.value.find((item) => item.product.id === productId);
	if (!line) return;
	if (line.quantity === 1) {
		cart.value = cart.value.filter((item) => item.product.id !== productId);
	} else {
		line.quantity -= 1;
	}
}

function deleteCartLine(productId: number) {
	cart.value = cart.value.filter((item) => item.product.id !== productId);
}

// Modal Detalle
function openProductDetail(product: Product) {
	selectedProduct.value = product;
	detailQuantity.value = 1;
}

function addDetailToCart() {
	if (!selectedProduct.value) return;
	addToCart(selectedProduct.value, detailQuantity.value, false);
	selectedProduct.value = null;
}

// Envío de orden: transferencia crea la venta aquí; QR la crea la API al aprobar el pago.
async function submitOrder() {
	checkoutError.value = '';
	if (!customerName.value.trim()) {
		checkoutError.value = 'Por favor escribe tu nombre completo.';
		return;
	}
	if (!customerPhone.value.trim()) {
		checkoutError.value = 'Por favor escribe tu teléfono o WhatsApp para coordinar el envío.';
		return;
	}
	if (!cart.value.length) return;

	const payload = {
		metodoPago: paymentMethod.value,
		montoPagado: cartTotal.value,
		cambio: 0,
		nombreCliente: `${customerName.value.trim()} | Tel: ${customerPhone.value.trim()}${customerAddress.value ? ` | Dir: ${customerAddress.value.trim()}` : ''}`,
		documento: customerDocument.value.trim() || undefined,
		detalles: cart.value.map((line) => ({
			idProducto: line.product.id,
			cantidad: line.quantity,
		})),
	};

	if (paymentMethod.value === 'qr') {
		await generarQr(payload);
		return;
	}

	submittingOrder.value = true;
	try {
		const response = await fetch(`${apiUrl}/ventas`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload),
		});

		const result = await response.json();
		if (!response.ok) {
			throw new Error(result.message || 'No pudimos registrar tu pedido.');
		}

		orderCode.value = result.codigo || String(result.id || Math.floor(100000 + Math.random() * 900000));
		cart.value = [];
		checkoutOpen.value = false;
		resetQr();
	} catch (error) {
		// El fallback local solo aplica a transferencia; QR requiere confirmar en la API.
		if (usingDemo.value && paymentMethod.value === 'transferencia') {
			const mockCode = `SERENA-${Math.floor(1000 + Math.random() * 9000)}`;
			orderCode.value = mockCode;
			cart.value = [];
			checkoutOpen.value = false;
			resetQr();
		} else {
			checkoutError.value = error instanceof Error ? error.message : 'No pudimos registrar tu pedido. Intenta nuevamente.';
		}
	} finally {
		submittingOrder.value = false;
	}
}

// Enlace de WhatsApp
const whatsappLink = computed(() => {
	const text = encodeURIComponent(
		`¡Hola SERENA! 🕯️ Acabo de realizar el pedido con código *#${orderCode.value}* a nombre de *${customerName.value}*. Me gustaría confirmar el método de entrega.`,
	);
	return `https://wa.me/59170000000?text=${text}`;
});
</script>

<template>
	<div class="storefront-wrapper">
		<!-- Barra superior de anuncios -->
		<aside class="announcement-bar" aria-label="Aviso de la tienda">
			<span>✨ <strong>Envíos a todo el país</strong></span>
			<span class="accent">•</span>
			<span>Hechas con <strong>100% Cera de Soya Natural</strong> y Fragancias Botánicas</span>
			<span class="accent">•</span>
			<span>Elaboración Artesanal</span>
		</aside>

		<!-- Cabecera Principal -->
		<header class="site-header">
			<div class="header-inner">
				<a class="brand" href="#inicio" aria-label="SERENA, inicio">
					<img src="/Original_1-8.png" alt="SERENA - Velas para volver a ti" />
				</a>

				<nav class="header-nav" aria-label="Navegación principal">
					<a href="#coleccion">Colección</a>
					<a href="#beneficios">Por qué SERENA</a>
					<a href="/nosotros">Nuestra Esencia</a>
					<a href="#contacto">Contacto</a>
				</nav>

				<div class="header-actions">
					<span class="header-caption">Velas para volver a ti</span>
					<button
						id="cart-toggle-btn"
						class="cart-button"
						type="button"
						@click="cartOpen = true"
						aria-label="Abrir carrito de compras"
					>
						<svg class="cart-icon" viewBox="0 0 24 24">
							<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
							<line x1="3" y1="6" x2="21" y2="6"></line>
							<path d="M16 10a4 4 0 0 1-8 0"></path>
						</svg>
						<span>Carrito</span>
						<strong>{{ cartCount }}</strong>
					</button>
				</div>
			</div>
		</header>

		<!-- Hero Section -->
		<section id="inicio" class="hero">
			<div class="hero-copy">
				<span class="eyebrow">Boutique Aromática Artesanal</span>
				<h1 class="hero-title">
					Velas creadas para pausar y <em>volver a ti.</em>
				</h1>
				<p class="hero-text">
					Encender una vela es regalarte un momento de presencia. Nuestras velas son vertidas a mano con cera de soya 100% vegetal, pabilos de algodón ecológico y esencias botánicas para envolver tu hogar en calma.
				</p>
				<div class="hero-actions">
					<a href="#coleccion" class="primary-button">
						<span>Explorar Colección</span>
						<span>↓</span>
					</a>
					<a href="#beneficios" class="secondary-button">
						<span>Conocer Más</span>
					</a>
				</div>
				<div class="hero-badges">
					<div class="hero-badge-item">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
						</svg>
						<span>Cera de Soya Pura</span>
					</div>
					<div class="hero-badge-item">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<circle cx="12" cy="12" r="10"></circle>
							<path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
							<line x1="9" y1="9" x2="9.01" y2="9"></line>
							<line x1="15" y1="9" x2="15.01" y2="9"></line>
						</svg>
						<span>Libre de Tóxicos</span>
					</div>
					<div class="hero-badge-item">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
						</svg>
						<span>Hecho con Amor</span>
					</div>
				</div>
			</div>

			<div class="hero-visual">
				<img
					src="https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=1200&q=85"
					alt="Vela artesanal SERENA encendida en ambiente cálido"
				/>
				<div class="hero-float-card">
					<p class="card-tag">Aroma Destacado</p>
					<h4>Vela Calma & Lavanda</h4>
					<p class="card-sub">Mezcla botánica relajante con más de 40 horas de luz suave.</p>
				</div>
			</div>
		</section>

		<!-- Pilares de Marca -->
		<section id="beneficios" class="pillars-section" aria-label="Pilares de calidad">
			<div class="pillars-grid">
				<div class="pillar-item">
					<div class="pillar-icon">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M12 2v8"></path>
							<path d="M4.93 10.93a10 10 0 0 0 14.14 0"></path>
							<path d="M2 18h20"></path>
						</svg>
					</div>
					<div>
						<h3>Cera 100% de Soya</h3>
						<p>Combustión limpia y lenta, sin derivados del petróleo ni humos negros nocivos.</p>
					</div>
				</div>

				<div class="pillar-item">
					<div class="pillar-icon">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
						</svg>
					</div>
					<div>
						<h3>Esencias Botánicas</h3>
						<p>Aceites concentrados con notas de aromaterapia que equilibran tus emociones.</p>
					</div>
				</div>

				<div class="pillar-item">
					<div class="pillar-icon">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
						</svg>
					</div>
					<div>
						<h3>Artesanía Cuidadosa</h3>
						<p>Cada pieza es vertida a mano en pequeños lotes garantizando máxima calidad.</p>
					</div>
				</div>

				<div class="pillar-item">
					<div class="pillar-icon">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<rect x="1" y="3" width="15" height="13"></rect>
							<polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
							<circle cx="5.5" cy="18.5" r="2.5"></circle>
							<circle cx="18.5" cy="18.5" r="2.5"></circle>
						</svg>
					</div>
					<div>
						<h3>Envíos Seguros</h3>
						<p>Empaque ecológico especialmente protegido para llegar perfecto a tu hogar.</p>
					</div>
				</div>
			</div>
		</section>

		<!-- Sección de Catálogo -->
		<section id="coleccion" class="collection-section">
			<div class="catalog-heading">
				<div>
					<span class="eyebrow">Catálogo SERENA</span>
					<h2>Velas para cada rincón y momento</h2>
				</div>
				<p class="heading-sub">
					Selecciona tu fragancia predilecta o haz clic en cualquier vela para conocer sus notas y propiedades.
				</p>
			</div>

			<!-- Barra de Herramientas -->
			<div class="toolbar">
				<div class="categories-pills" role="tablist" aria-label="Categorías">
					<button
						v-for="category in categories"
						:key="category"
						type="button"
						class="category-pill"
						:class="{ active: activeCategory === category }"
						@click="activeCategory = category"
					>
						{{ category }}
					</button>
				</div>

				<div class="search-box">
					<svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<circle cx="11" cy="11" r="8"></circle>
						<line x1="21" y1="21" x2="16.65" y2="16.65"></line>
					</svg>
					<input
						id="product-search-input"
						v-model="query"
						type="search"
						placeholder="Buscar vela o aroma..."
						aria-label="Buscar productos en el catálogo"
					/>
					<button
						v-if="query"
						type="button"
						class="search-clear"
						@click="query = ''"
						aria-label="Limpiar búsqueda"
					>
						✕
					</button>
				</div>
			</div>

			<!-- Nota de demo -->
			<p v-if="usingDemo" class="catalog-note">
				Mostrando la colección curada de ejemplo. Los productos registrados desde tu panel de administración aparecerán aquí automáticamente.
			</p>

			<!-- Estados de carga y vacío -->
			<div v-if="loading" class="empty-state">
				<h3>Preparando la colección...</h3>
				<p>Conectando con el catálogo de SERENA.</p>
			</div>

			<div v-else-if="!filteredProducts.length" class="empty-state">
				<h3>No encontramos velas para "{{ query }}"</h3>
				<p>Prueba con otros términos como 'lavanda', 'ámbar', 'calma' o selecciona otra categoría.</p>
				<button class="secondary-button" type="button" @click="query = ''; activeCategory = 'Todos'">
					Ver toda la colección
				</button>
			</div>

			<!-- Grid de Productos -->
			<div v-else class="product-grid">
				<article
					v-for="(product, index) in filteredProducts"
					:key="product.id"
					class="product-card"
				>
					<div
						class="product-card-image-wrap"
						@click="openProductDetail(product)"
						tabindex="0"
						:aria-label="`Ver detalle de ${product.nombre}`"
					>
						<div class="card-badges">
							<span class="badge-pill">{{ product.categoria?.nombre || 'Vela de Soya' }}</span>
							<span v-if="product.stock && product.stock <= 5" class="badge-pill stock-low">
								¡Solo quedan {{ product.stock }}!
							</span>
						</div>
						<img
							:src="productImage(product, index)"
							:alt="product.nombre"
							loading="lazy"
							@error="handleImageError($event, index)"
						/>
						<span class="card-quick-view">Vista Rápida 👁️</span>
					</div>

					<div class="product-card-body">
						<div>
							<div class="product-meta">
								<span class="product-category-name">
									{{ product.categoria?.nombre || 'Aromaterapia' }}
								</span>
								<span v-if="product.stock" class="product-stock-tag" style="font-size: 11px; color: var(--serena-sage)">
									{{ product.stock }} disp.
								</span>
							</div>
							<h3 class="product-card-title" @click="openProductDetail(product)">
								{{ product.nombre }}
							</h3>
							<p class="product-card-desc">
								{{ product.descripcion }}
							</p>
						</div>

						<div class="product-card-footer">
							<div class="product-price-block">
								<span class="product-price-label">Precio</span>
								<span class="product-price-val">{{ formatPrice(product.precioUnitario) }}</span>
							</div>

							<button
								class="card-add-button"
								type="button"
								:aria-label="`Añadir ${product.nombre} al carrito`"
								@click.stop="addToCart(product, 1, false)"
							>
								<span>+</span>
								<span>Agregar</span>
							</button>
						</div>
					</div>
				</article>
			</div>
		</section>

		<!-- Modal de Detalle de Producto -->
		<div
			v-if="selectedProduct"
			class="modal-backdrop"
			@click.self="selectedProduct = null"
			role="dialog"
			aria-modal="true"
		>
			<article class="detail-modal">
				<button
					class="close-button"
					type="button"
					@click="selectedProduct = null"
					aria-label="Cerrar ventana de detalle"
				>
					×
				</button>
				<div class="detail-modal-media">
					<img
						:src="productImage(selectedProduct)"
						:alt="selectedProduct.nombre"
						@error="handleImageError"
					/>
				</div>
				<div class="detail-modal-content">
					<div>
						<span class="eyebrow">{{ selectedProduct.categoria?.nombre || 'Selección Exclusiva' }}</span>
						<h2>{{ selectedProduct.nombre }}</h2>
						<p class="product-detail-desc">{{ selectedProduct.descripcion }}</p>

						<div class="detail-modal-tags">
							<span class="tag-badge">🌱 100% Cera de Soya</span>
							<span class="tag-badge">🕯️ Mecha de Algodón</span>
							<span class="tag-badge">⏳ ~45 Horas de Calma</span>
						</div>
					</div>

					<div class="detail-modal-purchase">
						<div class="detail-modal-price-row">
							<span style="font-size: 13px; color: var(--serena-sage)">Precio unitario:</span>
							<strong>{{ formatPrice(selectedProduct.precioUnitario) }}</strong>
						</div>

						<div class="detail-modal-actions">
							<div class="quantity-stepper" aria-label="Cantidad a comprar">
								<button
									type="button"
									:disabled="detailQuantity <= 1"
									@click="detailQuantity > 1 && detailQuantity--"
								>
									−
								</button>
								<span>{{ detailQuantity }}</span>
								<button type="button" @click="detailQuantity++">+</button>
							</div>

							<button
								class="primary-button"
								style="flex: 1"
								type="button"
								@click="addDetailToCart"
							>
								<span>Añadir al Carrito ({{ formatPrice(selectedProduct.precioUnitario * detailQuantity) }})</span>
							</button>
						</div>
					</div>
				</div>
			</article>
		</div>

		<!-- Carrito Lateral (Drawer) -->
		<div
			class="cart-backdrop"
			:class="{ open: cartOpen }"
			@click="cartOpen = false"
			aria-hidden="true"
		></div>

		<aside
			class="cart-drawer"
			:class="{ open: cartOpen }"
			role="dialog"
			aria-label="Carrito de compras"
			aria-modal="true"
		>
			<div class="drawer-heading">
				<div>
					<span class="eyebrow">Tu Compra</span>
					<h2>
						Carrito
						<small>({{ cartCount }} {{ cartCount === 1 ? 'artículo' : 'artículos' }})</small>
					</h2>
				</div>
				<button
					class="close-button"
					type="button"
					@click="cartOpen = false"
					aria-label="Cerrar carrito de compras"
				>
					×
				</button>
			</div>

			<div v-if="!cart.length" class="empty-state" style="margin: 40px 24px">
				<div style="font-size: 38px; margin-bottom: 12px">🕯️</div>
				<h3>Tu carrito está esperando</h3>
				<p>Aún no has agregado velas aromáticas a tu selección.</p>
				<button class="primary-button" type="button" @click="cartOpen = false">
					Ver catálogo de velas
				</button>
			</div>

			<div v-else class="cart-lines">
				<div v-for="line in cart" :key="line.product.id" class="cart-line">
					<img
						:src="productImage(line.product)"
						:alt="line.product.nombre"
						@error="handleImageError"
					/>
					<div class="cart-line-info">
						<div>
							<h3>{{ line.product.nombre }}</h3>
							<p class="cart-line-price">{{ formatPrice(line.product.precioUnitario) }} c/u</p>
						</div>
						<div class="cart-line-controls">
							<div class="quantity-stepper">
								<button
									type="button"
									@click="removeFromCart(line.product.id)"
									aria-label="Reducir cantidad"
								>
									−
								</button>
								<span>{{ line.quantity }}</span>
								<button
									type="button"
									@click="addToCart(line.product, 1, false)"
									aria-label="Aumentar cantidad"
								>
									+
								</button>
							</div>
							<button
								type="button"
								class="cart-remove-item"
								@click="deleteCartLine(line.product.id)"
							>
								Quitar
							</button>
						</div>
					</div>
				</div>
			</div>

			<div v-if="cart.length" class="cart-summary">
				<div class="cart-summary-row">
					<span>Artículos</span>
					<span>{{ cartCount }}</span>
				</div>
				<div class="cart-summary-row total">
					<span>Total a Pagar</span>
					<strong>{{ formatPrice(cartTotal) }}</strong>
				</div>
				<p class="shipping-perk">
					<span>🌿 Empaque artesanal seguro incluido</span>
				</p>
				<button
					id="checkout-trigger-btn"
					class="primary-button"
					type="button"
					@click="checkoutOpen = true; cartOpen = false"
				>
					<span>Proceder al Pago</span>
					<span>→</span>
				</button>
			</div>
		</aside>

		<!-- Modal de Checkout -->
		<div
			v-if="checkoutOpen"
			class="modal-backdrop"
			@click.self="checkoutOpen = false"
			role="dialog"
			aria-modal="true"
		>
			<form class="checkout-modal" @submit.prevent="submitOrder">
				<button
					class="close-button"
					type="button"
					@click="checkoutOpen = false"
					aria-label="Cerrar proceso de pago"
				>
					×
				</button>
				<span class="eyebrow">Finalizar Pedido</span>
				<h2>Detalles de Entrega</h2>

				<div class="checkout-order-summary">
					<span>Total de la orden ({{ cartCount }} artículos)</span>
					<strong>{{ formatPrice(cartTotal) }}</strong>
				</div>

				<div v-if="checkoutError" class="form-error">
					{{ checkoutError }}
				</div>

				<div class="form-group">
					<label for="cust-name">Nombre y Apellido *</label>
					<input
						id="cust-name"
						v-model="customerName"
						type="text"
						required
						placeholder="Ej. Valentina Morales"
					/>
				</div>

				<div class="form-group">
					<label for="cust-phone">WhatsApp / Teléfono Móvil *</label>
					<input
						id="cust-phone"
						v-model="customerPhone"
						type="tel"
						required
						placeholder="Ej. 70 123 456"
					/>
				</div>

				<div class="form-group">
					<label for="cust-address">Dirección y Ciudad de Envío</label>
					<input
						id="cust-address"
						v-model="customerAddress"
						type="text"
						placeholder="Ej. Av. Arce #1234, Zona Central, La Paz"
					/>
				</div>

				<div class="form-group">
					<label for="cust-doc">Cédula / Documento <span>(opcional)</span></label>
					<input
						id="cust-doc"
						v-model="customerDocument"
						type="text"
						placeholder="CI o NIT para tu factura"
					/>
				</div>

				<!-- Selector de método de pago: solo Transferencia o QR -->
				<div class="form-group">
					<label>Método de Pago</label>
					<div class="payment-method-tabs">
						<button
							type="button"
							:class="['pay-tab', { active: paymentMethod === 'transferencia' }]"
							@click="paymentMethod = 'transferencia'; resetQr()"
						>
							<span class="pay-tab-icon">🏦</span>
							<div>
								<strong>Transferencia</strong>
								<span>Tigo Money / BNB / Banco Unión</span>
							</div>
						</button>
						<button
							type="button"
							:class="['pay-tab', { active: paymentMethod === 'qr' }]"
							@click="paymentMethod = 'qr'; resetQr()"
						>
							<span class="pay-tab-icon">📲</span>
							<div>
								<strong>Pago QR</strong>
								<span>Escanea y paga al instante</span>
							</div>
						</button>
					</div>
				</div>

				<!-- Panel de espera QR -->
				<div v-if="paymentMethod === 'qr' && qrEstado !== 'idle'" class="qr-panel">
					<!-- Generando... -->
					<div v-if="qrEstado === 'generando'" class="qr-loading">
						<div class="qr-spinner"></div>
						<p>Generando tu código QR...</p>
					</div>

					<!-- QR Pendiente -->
					<div v-else-if="qrEstado === 'pendiente'" class="qr-waiting">
						<img :src="qrUrl!" alt="Código QR de pago SERENA" class="qr-image" />
						<div class="qr-info">
							<p class="qr-amount">Total a pagar: <strong>{{ formatPrice(cartTotal) }}</strong></p>
							<p class="qr-hint">Escanea el QR con tu app de billetera. El pedido se confirmará automáticamente al detectar el pago.</p>
							<div class="qr-pulse-row">
								<span class="qr-pulse-dot"></span>
								<span>Esperando confirmación de pago...</span>
							</div>
							<button type="button" class="qr-regenerate" @click="resetQr()">
								Cancelar y volver
							</button>
						</div>
					</div>

					<!-- QR Aprobado (transición antes del modal de éxito) -->
					<div v-else-if="qrEstado === 'aprobado'" class="qr-approved">
						<div class="qr-check">
							<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
								<path d="M20 6L9 17l-5-5"></path>
							</svg>
						</div>
						<p>¡Pago verificado! Registrando tu pedido...</p>
					</div>

					<!-- Error QR -->
					<div v-else-if="qrEstado === 'error'" class="form-error" style="margin-bottom:0">
						{{ qrError }}
						<button type="button" @click="resetQr()" style="margin-top:8px; text-decoration:underline; display:block">Intentar de nuevo</button>
					</div>
				</div>

				<button
					class="primary-button"
					type="submit"
					:disabled="submittingOrder || qrEstado === 'generando' || qrEstado === 'pendiente' || qrEstado === 'aprobado'"
				>
					<span v-if="submittingOrder">Registrando pedido...</span>
					<span v-else-if="qrEstado === 'generando'">Preparando pago...</span>
					<span v-else-if="qrEstado === 'pendiente'">Esperando el pago...</span>
					<span v-else>Confirmar Pedido ({{ formatPrice(cartTotal) }})</span>
					<span v-if="!submittingOrder && qrEstado === 'idle'">→</span>
					<span v-else class="button-loader" aria-hidden="true"></span>
				</button>
			</form>
		</div>

		<!-- Modal de Éxito / Confirmación -->
		<div
			v-if="orderCode"
			class="modal-backdrop"
			role="dialog"
			aria-modal="true"
		>
			<div class="success-modal">
				<div class="success-icon-wrap">
					<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
						<path d="M20 6L9 17l-5-5"></path>
					</svg>
				</div>
				<span class="eyebrow">¡Pedido Registrado con Éxito!</span>
				<h2>Gracias por elegir SERENA</h2>
				<p style="color: var(--serena-ink-muted); font-size: 14px; margin-bottom: 8px">
					Tu selección ha sido guardada. Nos pondremos en contacto contigo para preparar y despachar tus velas artesanales.
				</p>

				<div class="success-code-box">
					<span>Código de Referencia:</span>
					<strong>#{{ orderCode }}</strong>
				</div>

				<a
					:href="whatsappLink"
					target="_blank"
					rel="noopener noreferrer"
					class="success-whatsapp-btn"
				>
					<span>Confirmar por WhatsApp</span>
					<span>📲</span>
				</a>

				<button
					class="secondary-button"
					style="width: 100%; margin-top: 12px; justify-content: center"
					type="button"
					@click="orderCode = null"
				>
					Volver a la Tienda
				</button>
			</div>
		</div>

		<!-- Toast Flotante de Confirmación -->
		<aside
			v-if="toastMessage"
			class="toast-notification"
			role="status"
			aria-live="polite"
		>
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
				<polyline points="22 4 12 14.01 9 11.01"></polyline>
			</svg>
			<p>{{ toastMessage }}</p>
			<button type="button" @click="cartOpen = true; toastMessage = null">
				Ver Carrito
			</button>
		</aside>

		<!-- Cita de Marca / Statement -->
		<section id="nosotros" class="statement">
			<div class="statement-inner">
				<span class="eyebrow">Nuestra Filosofía</span>
				<h2>
					"Creemos en los pequeños rituales diarios que transforman un espacio común en un <em>santuario de paz.</em>"
				</h2>
				<p class="statement-desc">
					Cada vela SERENA se elabora pensando en el balance entre luz, aroma y serenidad. Diseñadas para que al final del día encuentres un momento de intimidad contigo mismo.
				</p>
			</div>
		</section>

		<!-- Footer de Lujo -->
		<footer id="contacto" class="site-footer">
			<div class="footer-inner">
				<div class="footer-brand">
					<img src="/Original_1-8.png" alt="SERENA Logo" />
					<p>
						Velas aromáticas artesanales elaboradas con cera de soya botánica y fragancias conscientes para transformar tu bienestar cotidiano.
					</p>
				</div>

				<div class="footer-col">
					<h4>Navegación</h4>
					<ul>
						<li><a href="#inicio">Inicio</a></li>
						<li><a href="#coleccion">Colección Completa</a></li>
						<li><a href="#beneficios">Propuesta de Valor</a></li>
						<li><a href="/nosotros">Nuestra Esencia</a></li>
						<li><a href="/privacidad">Política de Privacidad</a></li>
						<li><a href="/condiciones">Condiciones del Servicio</a></li>
					</ul>
				</div>

				<div class="footer-col">
					<h4>Colecciones</h4>
					<ul>
						<li><a href="#coleccion" @click="activeCategory = 'Aromáticas'">Aromáticas</a></li>
						<li><a href="#coleccion" @click="activeCategory = 'Colección Exclusiva'">Exclusivas</a></li>
						<li><a href="#coleccion" @click="activeCategory = 'Rituales'">Rituales</a></li>
						<li><a href="#coleccion" @click="activeCategory = 'Edición Regalo'">Kits de Regalo</a></li>
					</ul>
				</div>

				<div class="footer-col">
					<h4>Atención al Cliente</h4>
					<ul>
						<li><a href="https://wa.me/573001234567" target="_blank" rel="noopener noreferrer">WhatsApp Directo</a></li>
						<li><a href="mailto:hola@serenavelas.com">hola@serenavelas.com</a></li>
						<li><span>Lunes a Sábado: 9am - 7pm</span></li>
						<li><span>Envíos a nivel nacional</span></li>
					</ul>
				</div>
			</div>

			<div class="footer-bottom">
				<p>© {{ new Date().getFullYear() }} SERENA. Todos los derechos reservados.</p>
				<div class="footer-badges">
					<span class="footer-badge-tag">🌿 100% Cera de Soya</span>
					<span class="footer-badge-tag">🇧🇴 Hecho en Bolivia</span>
					<span class="footer-badge-tag">📦 Envío Seguro</span>
				</div>
			</div>
		</footer>
	</div>
</template>