import { createHash } from 'node:crypto';
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

const baselines = {
	index: [
		'050a0c32c095a85c227949c21ba28622e53db7b35e5a493b198a6709b8a02a17',
		'693c0c223f16e656a22e28144f9805a487fcbb27ef523a55f74a52cc37585e68',
		'f31002800b3d710b76ce1ee04b525571593f053100b090da776f3618d2d5b995',
		'26975aa1b6742e92bb96b94d51fcb6a3a95bd371a039a8c2b69444c2a9e18b18',
		'2666376f4455d1f6fbf6bc900bcaf9293f89387eb9819b012abf99c2067bc23e',
		'30299c324bc9ec94c3585aaa268753622b93d814e145ccd675446d1e418d1ad5',
		'ec2c6cb4f335ce82c893cc9c3644bce405f4d41af654c4f538ab65b50b8af97d',
		'e867be83c245fee57fa42eb796632a007c3c103c2c163b7f0b09c145720418df',
		'23fcc530c398f9b8848d27bdf897a48c013779c5211e94e04f6ae4ba79c8bb58',
		'2b5556bd0959a4e3f2176530588a583429ab26dc6fab57e4a2b9ceedefd2422e',
	],
	esm: ['1a65261c854f84c3fd6c6adf3cffd51fca0a0fcf69675a7bde1b22e1a78626b0'],
	unpkg: ['1a65261c854f84c3fd6c6adf3cffd51fca0a0fcf69675a7bde1b22e1a78626b0'],
};

const snippets = (name, html = readFileSync(`demo/${name}.html`, 'utf8')) => {
	const template = document.createElement('template');
	template.innerHTML = html;
	return [...template.content.querySelectorAll('pre code')];
};

describe('displayed component-code highlighting', () => {
	it('allows the publishing helper to update a future CDN version without freezing displayed text or marks', () => {
		const fixture = resolve(`.highlight-release-fixture-${process.pid}`);
		const originalHtml = readFileSync('demo/esm.html', 'utf8');
		const originalPackage = readFileSync('package.json', 'utf8');
		try {
			mkdirSync(resolve(fixture, 'scripts'), { recursive: true });
			mkdirSync(resolve(fixture, 'demo'));
			cpSync(
				'scripts/update-demo-versions.js',
				resolve(fixture, 'scripts/update-demo-versions.mjs'),
			);
			writeFileSync(resolve(fixture, 'demo/esm.html'), originalHtml);
			writeFileSync(
				resolve(fixture, 'package.json'),
				JSON.stringify({
					...JSON.parse(originalPackage),
					version: '9.8.7',
				}),
			);
			const result = spawnSync(
				process.execPath,
				['scripts/update-demo-versions.mjs'],
				{
					cwd: fixture,
					encoding: 'utf8',
				},
			);
			expect(result.status, result.stderr).toBe(0);
			const updatedHtml = readFileSync(
				resolve(fixture, 'demo/esm.html'),
				'utf8',
			);
			expect(updatedHtml).not.toBe(originalHtml);
			expect(updatedHtml).toContain(
				'dynamic-datalist@9.8.7/dynamic-datalist.js',
			);
			const updatedCode = snippets('esm', updatedHtml);
			expect(
				updatedCode.map((code) =>
					createHash('sha256').update(code.textContent).digest('hex'),
				),
			).toEqual(baselines.esm);
			expect(updatedCode.map((code) => code.outerHTML)).toEqual(
				snippets('esm').map((code) => code.outerHTML),
			);
			expect(readFileSync('demo/esm.html', 'utf8')).toBe(originalHtml);
			expect(readFileSync('package.json', 'utf8')).toBe(originalPackage);
		} finally {
			rmSync(fixture, { recursive: true, force: true });
		}
	});

	for (const [name, hashes] of Object.entries(baselines)) {
		it(`${name} preserves every displayed code character`, () => {
			expect(
				snippets(name).map((code) =>
					createHash('sha256').update(code.textContent).digest('hex'),
				),
			).toEqual(hashes);
		});

		it(`${name} marks component tags and any displayed imports or registration, not surrounding HTML`, () => {
			expect(
				snippets(name).map(
					(code) => code.querySelectorAll('mark').length,
				),
			).toEqual(name === 'index' ? [2, 2, 2, 2, 2, 2, 2, 2, 5, 2] : [2]);
			for (const code of snippets(name)) {
				const marks = [...code.querySelectorAll('mark')];
				const componentCode =
					code.textContent.match(
						/<\/?dynamic-datalist\b[^>]*>|\bimport\s[\s\S]*?['"][^'"]*dynamic-datalist[^'"]*['"];?|\bcustomElements\.define\([\s\S]*?\);|\bdefineDynamicDatalist\(\);?|\bel\.addEventListener\(\s*['"]dynamic-datalist:[\s\S]*?\}\);/g,
					) || [];
				expect(componentCode.length).toBeGreaterThan(0);
				for (const text of componentCode) {
					expect(
						marks.some((mark) => mark.textContent.includes(text)),
						text,
					).toBe(true);
				}
				expect(code.querySelector('mark mark')).toBeNull();
				for (const mark of marks) {
					expect(mark.textContent).not.toMatch(
						/<\/?(?:label|input|form|datalist|option|button)\b/,
					);
				}
			}
		});
	}
});
