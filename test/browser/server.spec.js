import { request } from 'node:http';
import { test, expect } from '@playwright/test';

const status = (path) =>
	new Promise((resolve, reject) => {
		const req = request(
			{ hostname: '127.0.0.1', port: 4186, path },
			(response) => {
				response.resume();
				response.on('end', () => resolve(response.statusCode));
			},
		);
		req.setTimeout(5000, () =>
			req.destroy(new Error('Fixture request timed out')),
		);
		req.on('error', reject);
		req.end();
	});

test('malformed URL returns 400 and the next valid request still succeeds', async () => {
	expect(await status('//[')).toBe(400);
	expect(await status('/demo/index.html')).toBe(200);
});
