import {
	cpSync,
	mkdirSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const read = (path) => readFileSync(resolve(path), 'utf8');

describe('shared demo surface contracts', () => {
	it('keeps supporting prose on reading surfaces without unsafe state colors', () => {
		const css = read('demo/styles.css');
		expect(css).not.toMatch(
			/GrayText|ActiveText|SelectedItem|Highlight|AccentColor/,
		);
		expect(css).not.toMatch(/opacity:\s*0\.8/);
		expect(css).not.toMatch(/:focus-visible\s*\{/);
		expect(css).toMatch(/box-sizing:\s*border-box/);
	});

	describe('retained release automation', () => {
		it('keeps the staged version helper and push-with-tags scripts intact', () => {
			const pkg = JSON.parse(read('package.json'));
			expect(pkg.scripts.version).toBe(
				'node scripts/update-demo-versions.js && git add demo/esm.html',
			);
			expect(pkg.scripts.postversion).toBe('git push --follow-tags');
			expect(read('demo/esm.html')).toContain(
				`dynamic-datalist@${pkg.version}/dynamic-datalist.js`,
			);
		});

		it('updates the CDN pin in an isolated project fixture without touching the working version', () => {
			const fixture = resolve(`.release-fixture-${process.pid}`);
			try {
				mkdirSync(resolve(fixture, 'scripts'), { recursive: true });
				mkdirSync(resolve(fixture, 'demo'));
				cpSync(
					'scripts/update-demo-versions.js',
					resolve(fixture, 'scripts/update-demo-versions.mjs'),
				);
				cpSync('demo/esm.html', resolve(fixture, 'demo/esm.html'));
				writeFileSync(
					resolve(fixture, 'package.json'),
					JSON.stringify({
						name: '@aarongustafson/dynamic-datalist',
						version: '9.8.7',
					}),
				);
				const result = spawnSync(
					process.execPath,
					['scripts/update-demo-versions.mjs'],
					{ cwd: fixture, encoding: 'utf8' },
				);
				expect(result.status, result.stderr).toBe(0);
				expect(
					readFileSync(resolve(fixture, 'demo/esm.html'), 'utf8'),
				).toContain('dynamic-datalist@9.8.7/dynamic-datalist.js');
				expect(read('package.json')).not.toContain('9.8.7');
			} finally {
				rmSync(fixture, { recursive: true, force: true });
			}
		});
	});

	for (const name of ['index', 'esm', 'unpkg']) {
		it(`${name} retains code/live layout, native fallback, and shared credit`, () => {
			const html = read(`demo/${name}.html`);
			expect(html).toContain('class="code-demo-pair"');
			expect(html).toContain('<footer>');
			expect(html).toContain('Aaron Gustafson');
			expect(html).toContain('<noscript');
			expect(html).toContain('<datalist');
		});
	}

	it('renders fetched options and errors as text, not markup', () => {
		expect(read('demo/index.html')).not.toContain('log.innerHTML');
	});
});
