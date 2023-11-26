import { publishEvent } from '$lib/server/pushpin';
import type { Actions } from './$types';

export const actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		const text = data.get('text');
        await publishEvent('channel:general', { text });
	},
} satisfies Actions;