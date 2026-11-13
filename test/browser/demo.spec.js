import { readFile } from 'node:fs/promises';
import { test, expect } from '@playwright/test';

const source = await readFile('dynamic-datalist.js', 'utf8');
const definition = await readFile('define.js', 'utf8');
const css = await readFile('demo/styles.css', 'utf8');
const pages = ['index.html', 'esm.html', 'unpkg.html'];

async function open(
	page,
	name = 'index.html',
	{ blockModule = false, timeout = 5000 } = {},
) {
	await page.route('https://esm.sh/**', (route) =>
		blockModule
			? route.abort()
			: route.fulfill({ contentType: 'text/javascript', body: source }),
	);
	await page.route('https://unpkg.com/**', (route) =>
		blockModule
			? route.abort()
			: route.fulfill({
					contentType: 'text/javascript',
					body: definition.replace(
						"'./dynamic-datalist.js'",
						"'http://127.0.0.1:4186/dynamic-datalist.js'",
					),
				}),
	);
	await page.goto(`/demo/${name}`);
	await expect
		.poll(
			() =>
				page
					.locator('dynamic-datalist input')
					.first()
					.evaluate((el) => Boolean(el.list)),
			{ timeout },
		)
		.toBe(true);
	if (name !== 'index.html') {
		await expect(page.locator('#demo-options option')).toHaveCount(5, {
			timeout,
		});
		await expect(page.locator('#demo-options option')).toHaveText(
			[
				'Popular - Option 1',
				'Popular - Option 2',
				'Popular - Option 3',
				'Popular Result A',
				'Popular Result B',
			],
			{ timeout },
		);
	}
}

async function contrast(locator, foregroundProperty = 'color') {
	return locator.evaluate((element, foregroundProperty) => {
		const canvas = document.createElement('canvas');
		canvas.width = canvas.height = 1;
		const ctx = canvas.getContext('2d', { willReadFrequently: true });
		const paint = (color) => {
			ctx.fillStyle = color;
			ctx.fillRect(0, 0, 1, 1);
			return [...ctx.getImageData(0, 0, 1, 1).data];
		};
		const chain = [];
		for (let node = element; node; node = node.parentElement)
			chain.unshift(node);
		let background;
		for (const node of chain) {
			const style = getComputedStyle(node);
			if (style.opacity !== '1') throw new Error('Unexpected opacity');
			background = paint(style.backgroundColor);
		}
		if (background[3] !== 255) throw new Error('Expected opaque surface');
		const foreground = paint(getComputedStyle(element)[foregroundProperty]);
		const luminance = (rgb) =>
			rgb.slice(0, 3).reduce((sum, channel, index) => {
				const v = channel / 255;
				return (
					sum +
					(v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4) *
						[0.2126, 0.7152, 0.0722][index]
				);
			}, 0);
		const [a, b] = [luminance(background), luminance(foreground)].sort(
			(a, b) => b - a,
		);
		return (a + 0.05) / (b + 0.05);
	}, foregroundProperty);
}

// The study's 62 observations reduce to 19 distinct palettes. Alpha is composited.
const palettes = [
	['#ffffff', '#000000', '#efefef', '#000000', '#ffffff', '#000000'],
	['#121212', '#ffffff', '#6b6b6b', '#ffffff', '#3b3b3b', '#ffffff'],
	['#ffffff', '#000000', '#e9e9ed', '#000000', '#ffffff', '#000000'],
	['#1c1b22', '#fbfbfe', '#2b2a33', '#fbfbfe', '#2b2a33', '#fbfbfe'],
	['#ffffff', '#000000', '#c0c0c0', '#000000d8', '#ffffff', '#000000d8'],
	['#1e1e1e', '#ffffff', '#ffffff3f', '#ffffffd8', '#ffffff3f', '#ffffffd8'],
	['#ffffff', '#000000', '#f0f0f0', '#000000', '#ffffff', '#000000'],
	['#202020', '#ffffff', '#202020', '#ffffff', '#202020', '#ffffff'],
	['#fffaef', '#3d3d3d', '#fffaef', '#202020', '#fffaef', '#3d3d3d'],
	['#2d3236', '#ffffff', '#2d3236', '#b6f6f0', '#2d3236', '#ffffff'],
	['#000000', '#ffffff', '#000000', '#ffee32', '#000000', '#ffffff'],
	['#000000', '#ffffff', '#000000', '#ffee32', '#000000', '#ffee32'],
	['#2d3236', '#ffffff', '#2d3236', '#b6f6f0', '#2d3236', '#b6f6f0'],
	['#fffaef', '#3d3d3d', '#fffaef', '#202020', '#fffaef', '#202020'],
	['#ffffff', '#000000', '#c0c0c0', '#000000', '#ffffff', '#000000'],
	['#000000', '#ffffff', '#c0c0c0', '#000000', '#ffffff', '#000000'],
	['#ffffff', '#000000', '#ffffff', '#000000d8', '#ffffff', '#000000d8'],
	['#282828', '#ffffff', '#202020', '#ffffff', '#202020', '#ffffff'],
	['#202020', '#ffffff', '#00000000', '#ffffff', '#00000000', '#ffffff'],
];
const tokens = [
	'Canvas',
	'CanvasText',
	'ButtonFace',
	'ButtonText',
	'Field',
	'FieldText',
];

for (const name of pages) {
	for (const colorScheme of ['light', 'dark']) {
		test(`${name}: ${colorScheme} fields have flat contrasting boundaries and native lists`, async ({
			page,
		}) => {
			await page.emulateMedia({ colorScheme });
			await open(page, name);
			const input = page.locator('dynamic-datalist input').first();
			expect(
				await input.evaluate((el) => {
					const style = getComputedStyle(el);
					return ['Top', 'Right', 'Bottom', 'Left'].map((side) => ({
						style: style[`border${side}Style`],
						width: style[`border${side}Width`],
						color: style[`border${side}Color`] === style.color,
					}));
				}),
			).toEqual(
				Array(4).fill({ style: 'solid', width: '1px', color: true }),
			);
			expect(
				await contrast(input, 'borderTopColor'),
			).toBeGreaterThanOrEqual(3);
			expect(await contrast(input)).toBeGreaterThanOrEqual(4.5);
			await input.focus();
			await page.keyboard.type('Test');
			await expect
				.poll(() => input.evaluate((el) => el.list.options.length))
				.toBe(5);
			await page.keyboard.press('ArrowDown');
			await page.keyboard.press('Escape');
			await expect(input).toBeFocused();
			expect(
				await input.evaluate((el) => getComputedStyle(el).outlineStyle),
			).not.toBe('none');
			expect(
				await input.evaluate((el) => getComputedStyle(el).appearance),
			).not.toBe('none');
		});

		test(`${name}: ${colorScheme} readable prose, keyboard focus, and reflow`, async ({
			page,
		}) => {
			await page.emulateMedia({ colorScheme });
			await open(page, name);
			for (const selector of [
				'body',
				'.demo-section',
				'.demo',
				'small',
				'.api-reference',
				'footer',
			]) {
				const locator = page.locator(selector).first();
				if (await locator.count())
					expect(
						await contrast(locator),
						selector,
					).toBeGreaterThanOrEqual(4.5);
			}
			await page.keyboard.press('Tab');
			await expect(page.locator(':focus-visible')).toHaveCount(1);
			expect(
				await page
					.locator(':focus-visible')
					.evaluate((el) => el.tagName),
			).toMatch(/^(A|INPUT)$/);
			expect(
				await page
					.locator(':focus-visible')
					.evaluate((el) => getComputedStyle(el).outlineStyle),
			).not.toBe('none');
			await page.setViewportSize({ width: 1280, height: 900 });
			const code = await page
				.locator('.code-demo-pair pre')
				.first()
				.boundingBox();
			const live = await page
				.locator('.code-demo-pair .demo')
				.first()
				.boundingBox();
			expect(code.x).toBeLessThan(live.x);
			await page.setViewportSize({ width: 320, height: 800 });
			expect(
				await page.evaluate(() => document.documentElement.scrollWidth),
			).toBeLessThanOrEqual(320);
			const narrowCode = await page
				.locator('.code-demo-pair pre')
				.first()
				.boundingBox();
			const narrowLive = await page
				.locator('.code-demo-pair .demo')
				.first()
				.boundingBox();
			expect(narrowCode.y + narrowCode.height).toBeLessThanOrEqual(
				narrowLive.y,
			);
		});
	}

	test(`${name}: native fallback without JavaScript`, async ({ browser }) => {
		const context = await browser.newContext({ javaScriptEnabled: false });
		const page = await context.newPage();
		await page.goto(`http://127.0.0.1:4186/demo/${name}`);
		const input = page.locator('input[list]').first();
		await input.fill('My own value');
		await expect(input).toHaveValue('My own value');
		expect(
			await input.evaluate((el) => el.list.options.length),
		).toBeGreaterThan(0);
		await expect(page.locator('noscript')).toBeVisible();
		await context.close();
	});

	test(`${name}: failed module preserves authored native list`, async ({
		page,
	}) => {
		await page.route('**/*.js*', (route) => route.abort());
		await page.goto(`/demo/${name}`);
		const input = page.locator('input[list]').first();
		await input.fill('Still editable');
		expect(
			await input.evaluate((el) => el.list.options.length),
		).toBeGreaterThan(0);
		await expect(input).toHaveValue('Still editable');
	});
}

for (const name of ['esm.html', 'unpkg.html']) {
	test(`${name}: blocked module fails normal readiness despite authored fallback`, async ({
		page,
	}) => {
		await expect(
			open(page, name, { blockModule: true, timeout: 500 }),
		).rejects.toThrow();
		await expect(page.locator('#demo-options option')).toHaveCount(1);
		await expect(page.locator('#demo-options option')).toHaveText(
			'Popular option',
		);
	});
}

test('recorded study palettes preserve prose and control text contrast', async ({
	page,
}) => {
	await open(page);
	await page.locator('link[rel="stylesheet"]').evaluate((el) => el.remove());
	for (const palette of palettes) {
		const colors = Object.fromEntries(
			tokens.map((token, index) => [token.toLowerCase(), palette[index]]),
		);
		const replaced = css.replace(
			/\b(CanvasText|Canvas|ButtonFace|ButtonText|FieldText|Field)\b/gi,
			(token) => colors[token.toLowerCase()],
		);
		const style = await page.addStyleTag({ content: replaced });
		for (const selector of [
			'body',
			'small',
			'footer',
			'.demo-section',
			'.api-reference',
			'pre',
			'input',
			'button',
			'code',
		]) {
			expect(
				await contrast(page.locator(selector).first()),
				`${palette[0]} ${selector}`,
			).toBeGreaterThanOrEqual(4.5);
		}
		expect(
			await contrast(page.locator('input').first(), 'borderTopColor'),
		).toBeGreaterThanOrEqual(3);
		await style.evaluate((el) => el.remove());
	}
});

test('native datalist updates, keeps free text, and recovers from errors safely', async ({
	page,
}) => {
	const errors = [];
	page.on('pageerror', (error) => errors.push(error.message));
	await open(page);
	const input = page.locator('#search4');
	await expect(input).toHaveAccessibleName('City');
	await expect(input).toHaveAccessibleDescription(
		'Pre-populated with New York, Los Angeles, and Chicago',
	);
	await input.focus();
	await page.keyboard.type('Test');
	await expect(page.locator('#cities-list option')).toHaveCount(5);
	await expect(input).toBeFocused();
	await page.keyboard.press('ArrowDown');
	await page.keyboard.press('Escape');
	await expect(input).toBeFocused();
	await input.fill('My own city');
	await expect(input).toHaveValue('My own city');
	await page.locator('#example4').evaluate((el) => {
		el.endpoint = '/api/unavailable';
	});
	await page.keyboard.type('x');
	await expect(page.locator('#log4')).toContainText('Error:');
	await expect(page.locator('#cities-list option')).toHaveCount(5);
	await expect(input).toHaveValue('My own cityx');
	await page.locator('#example4').evaluate((el) => {
		el.endpoint = '/api/cities';
	});
	await page.keyboard.type('y');
	await expect(page.locator('#log4')).toContainText('Updated:');
	await page.locator('#example4').evaluate((el) => {
		el.dispatchEvent(
			new CustomEvent('dynamic-datalist:error', {
				detail: { error: new Error('<img src=x onerror=alert(1)>') },
			}),
		);
	});
	await expect(page.locator('#log4')).toContainText('Error:');
	await expect(page.locator('#log4 img')).toHaveCount(0);
	await expect(input).toHaveValue('My own cityxy');
	expect(await contrast(page.locator('#log4'))).toBeGreaterThanOrEqual(4.5);
	expect(errors).toEqual([]);
});

test('empty results and untrusted option text leave the native input usable', async ({
	page,
}) => {
	await open(page);
	const input = page.locator('#search1');
	await page.evaluate(() => {
		window.fetch = async () => ({
			ok: true,
			json: async () => ({ options: [] }),
		});
	});
	await input.focus();
	await page.keyboard.type('Empty');
	await expect(page.locator('#log1')).toContainText('Received 0 options');
	await expect(input).toHaveValue('Empty');
	await expect(input).toBeFocused();
	await page.evaluate(() => {
		window.fetch = async () => ({
			ok: true,
			json: async () => ({ options: ['<img src=x onerror=alert(1)>'] }),
		});
	});
	await page.keyboard.type('x');
	await expect(page.locator('#log1')).toContainText('<img');
	await expect(page.locator('#log1 img, datalist img')).toHaveCount(0);
	await expect(input).toHaveValue('Emptyx');
});

for (const colorScheme of ['light', 'dark']) {
	test(`${colorScheme}: native field, code block, and marked passage pairs`, async ({
		page,
	}) => {
		await page.emulateMedia({ colorScheme });
		await open(page);
		for (const selector of ['input', 'pre', 'pre mark']) {
			expect(
				await contrast(page.locator(selector).first()),
				selector,
			).toBeGreaterThanOrEqual(4.5);
		}
	});

	test(`${colorScheme}: native ButtonText/ButtonFace pair only`, async ({
		page,
		browserName,
	}) => {
		test.fail(
			process.platform === 'linux' &&
				browserName === 'webkit' &&
				colorScheme === 'dark',
			'Bundled Ubuntu WebKit dark ButtonText/ButtonFace is 1.82:1 outside the recorded study.',
		);
		await page.emulateMedia({ colorScheme });
		await open(page);
		for (const selector of ['code', 'button']) {
			expect(
				await contrast(page.locator(selector).first()),
				selector,
			).toBeGreaterThanOrEqual(4.5);
		}
	});

	test(`${colorScheme}: active links retain readable text and an underline`, async ({
		page,
	}) => {
		await page.emulateMedia({ colorScheme });
		await open(page);
		const link = page.locator('header a').first();
		await link.hover();
		await page.mouse.down();
		try {
			expect(await contrast(link)).toBeGreaterThanOrEqual(4.5);
			expect(
				await link.evaluate(
					(el) => getComputedStyle(el).textDecorationLine,
				),
			).toContain('underline');
		} finally {
			await page.mouse.up();
		}
	});
}

test('forced colors and increased contrast preserve automatic adjustment and native focus', async ({
	page,
	browserName,
}) => {
	test.skip(
		browserName === 'webkit',
		'WebKit does not emulate forced colors.',
	);
	await page.emulateMedia({ forcedColors: 'active', contrast: 'more' });
	await open(page);
	await page.keyboard.press('Tab');
	await expect(page.locator('header a').first()).toBeFocused();
	expect(
		await page
			.locator('body')
			.evaluate((el) => getComputedStyle(el).forcedColorAdjust),
	).toBe('auto');
	for (const selector of ['small', 'footer', '.api-reference', 'input'])
		expect(
			await contrast(page.locator(selector).first()),
		).toBeGreaterThanOrEqual(4.5);
	const input = page.locator('input').first();
	expect(await contrast(input, 'borderTopColor')).toBeGreaterThanOrEqual(3);
	expect(
		await input.evaluate((el) => getComputedStyle(el).backgroundImage),
	).toBe('none');
});
