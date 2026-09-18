// @ts-check
import { defineConfig, envField } from 'astro/config';
import vue from '@astrojs/vue';

// https://astro.build/config
export default defineConfig({
	integrations: [vue()],
	env: {
		schema: {
			PUBLIC_API_URL: envField.string({
				context: 'client',
				access: 'public',
			}),
			PUBLIC_DEMO_MODE: envField.boolean({
				context: 'client',
				access: 'public',
				default: false,
			}),
		},
	},
});
