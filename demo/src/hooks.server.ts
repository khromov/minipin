import { building } from "$app/environment";
import type { Handle } from "@sveltejs/kit";
import { sequence } from "@sveltejs/kit/hooks";

const logger: Handle = async ({ event, resolve }) => {
	const requestStartTime = Date.now();
	const response = await resolve(event);

	// Note: This is specific to the CapRover environment
	const ip =
		event.request.headers.get('x-forwarded-for') ||
		(building ? '127.0.0.1' : event.getClientAddress());

	const date = new Date(requestStartTime);
	const wlz = (num: number) => (num < 10 ? `0${num}` : num);

	console.log(
		`${wlz(date.getHours())}:${wlz(date.getMinutes())}:${wlz(date.getSeconds())}`,
		`[${ip}]`,
		event.request.method,
		event.url.pathname,
		`- 🐇 ${Date.now() - requestStartTime} ms`,
		`${response.status === 200 ? '✅' : '❌'} ${response.status}`
	);
	return response;
};

export const handle: Handle = sequence(logger);