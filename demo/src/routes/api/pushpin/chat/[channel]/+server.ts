import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	const { channel } = params;

	return new Response(null, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Grip-Hold': 'stream',
            'Grip-Channel': `channel:${channel}`,
            'Grip-Keep-Alive': '\\n; format=cstring; timeout=15'
        }
    });
};