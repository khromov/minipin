import { env } from '$env/dynamic/private';

export const publishEvent = async (channel: string, data: any, type = 'message') => {
	const pushpinUrl = env.PUSHPIN_CONTROL_URI || 'http://localhost:5561';
	const gripData = {
		items: [
			{
				channel: channel,
				formats: {
					'http-stream': {
						content: `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`
					}
				}
			}
		]
	};

	try {
		const response = await fetch(`${pushpinUrl}/publish`, {
			method: 'POST',
			body: JSON.stringify(gripData),
			headers: { 'Content-Type': 'application/json' }
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
	} catch (error: any) {
		console.log(
			`😅 Publish failed! Message: ${error?.message || 'Unknown error'}, Context: ${JSON.stringify(
				error
			)}`
		);
	}
};