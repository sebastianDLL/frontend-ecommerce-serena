export const API_URL = import.meta.env.PUBLIC_API_URL?.trim() || '/api/v1';
export const API_BASE_URL = API_URL.replace(/\/api\/v1\/?$/, '');
export const DEMO_MODE = import.meta.env.DEV || import.meta.env.PUBLIC_DEMO_MODE === true;
export const MAX_CUSTOMER_NAME_LENGTH = 100;
