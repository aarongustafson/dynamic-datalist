import { createReadStream } from 'node:fs';
import { realpath, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const types = {
	'.css': 'text/css',
	'.html': 'text/html',
	'.js': 'text/javascript',
	'.json': 'application/json',
};

createServer(async (request, response) => {
	let pathname;
	try {
		pathname = decodeURIComponent(
			new URL(request.url, 'http://localhost').pathname,
		);
	} catch {
		response.writeHead(400).end();
		return;
	}
	try {
		const path = await realpath(resolve(root, `.${pathname}`));
		if (!path.startsWith(`${resolve(root)}${sep}`)) {
			response.writeHead(403).end();
			return;
		}
		const file = await stat(path);
		if (!file.isFile()) {
			response.writeHead(404).end();
			return;
		}
		response.writeHead(200, {
			'content-type': types[extname(path)] || 'application/octet-stream',
			'content-length': file.size,
			'cache-control': 'no-store',
		});
		if (request.method === 'HEAD') response.end();
		else
			createReadStream(path)
				.on('error', () => response.destroy())
				.pipe(response);
	} catch {
		response.writeHead(404).end();
	}
}).listen(Number(process.env.PORT || 4186), '127.0.0.1');
