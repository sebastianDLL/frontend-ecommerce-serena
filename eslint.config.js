import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import astro from 'eslint-plugin-astro';
import vue from 'eslint-plugin-vue';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default defineConfig(
	{ ignores: ['dist/**', '.astro/**', 'node_modules/**', 'public/**'] },
	js.configs.recommended,
	tseslint.configs.recommended,
	vue.configs['flat/essential'],
	astro.configs['flat/recommended'],
	{
		languageOptions: {
			globals: { ...globals.browser },
		},
	},
	{
		files: ['**/*.vue'],
		languageOptions: {
			parserOptions: {
				parser: tseslint.parser,
				extraFileExtensions: ['.vue'],
				ecmaVersion: 'latest',
				sourceType: 'module',
			},
		},
	},
	{
		files: ['**/*.cjs'],
		languageOptions: {
			globals: { ...globals.node },
		},
		rules: {
			'@typescript-eslint/no-require-imports': 'off',
		},
	},
	{
		rules: {
			'@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
			'vue/multi-word-component-names': 'off',
		},
	},
	prettier,
);
