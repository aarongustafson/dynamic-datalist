import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DynamicDatalistElement } from '../dynamic-datalist.js';

describe('DynamicDatalistElement', () => {
	let element;
	let input;

	beforeEach(() => {
		// Reset all mocks before each test
		vi.restoreAllMocks();

		element = document.createElement('dynamic-datalist');
		element.setAttribute('endpoint', '/api/test');

		input = document.createElement('input');
		input.type = 'text';
		element.appendChild(input);

		document.body.appendChild(element);
	});

	afterEach(() => {
		// Only remove if still in document
		if (element.parentNode === document.body) {
			document.body.removeChild(element);
		}
	});

	it('should be defined', () => {
		expect(customElements.get('dynamic-datalist')).toBe(
			DynamicDatalistElement,
		);
	});

	it('should create an instance', () => {
		expect(element).toBeInstanceOf(DynamicDatalistElement);
		expect(element).toBeInstanceOf(HTMLElement);
	});

	it('should not have a shadow root', () => {
		expect(element.shadowRoot).toBeFalsy();
	});

	it('should find the input element', async () => {
		await new Promise((resolve) => setTimeout(resolve, 10));
		expect(element.__$input).toBe(input);
	});

	it('should create a datalist when none exists', async () => {
		await new Promise((resolve) => setTimeout(resolve, 10));
		expect(element.__$datalist).toBeTruthy();
		expect(element.__$datalist.tagName).toBe('DATALIST');
		expect(input.hasAttribute('list')).toBe(true);
	});

	it('should use existing datalist if present', async () => {
		// Set up everything from scratch for this test
		const element = document.createElement('dynamic-datalist');
		element.setAttribute('endpoint', '/api/test');
		const input = document.createElement('input');
		input.type = 'text';
		input.setAttribute('list', 'test-list');
		const existingDatalist = document.createElement('datalist');
		existingDatalist.id = 'test-list';
		element.appendChild(input);
		element.appendChild(existingDatalist);
		document.body.appendChild(element);
		// Wait for the component to finish initialization (rAF logic)
		await new Promise((resolve) => {
			element.addEventListener('dynamic-datalist:ready', resolve, {
				once: true,
			});
		});
		// Wait for the next animation frame to ensure rAF logic has completed
		await new Promise(requestAnimationFrame);
		expect(element.__$datalist).toBe(existingDatalist);
		// Clean up
		document.body.removeChild(element);
	});

	it('should have default method of "get"', async () => {
		await new Promise((resolve) => setTimeout(resolve, 10));
		expect(element.method).toBe('get');
	});

	it('should accept custom method attribute', async () => {
		element.setAttribute('method', 'post');
		element.remove();
		document.body.appendChild(element);

		await new Promise((resolve) => setTimeout(resolve, 10));
		expect(element.method).toBe('post');
	});

	it('should have default key of "query"', async () => {
		await new Promise((resolve) => setTimeout(resolve, 10));
		expect(element.key).toBe('query');
	});

	it('should accept custom key attribute', async () => {
		element.setAttribute('key', 'search');
		element.remove();
		document.body.appendChild(element);

		await new Promise((resolve) => setTimeout(resolve, 10));
		expect(element.key).toBe('search');
	});

	it('should emit ready event on initialization', async () => {
		const readyHandler = vi.fn();
		element.addEventListener('dynamic-datalist:ready', readyHandler);

		element.remove();
		document.body.appendChild(element);

		await new Promise((resolve) => setTimeout(resolve, 10));
		expect(readyHandler).toHaveBeenCalled();
	});

	it('should warn if no input element is found', async () => {
		const warnSpy = vi.spyOn(console, 'warn');

		const emptyElement = document.createElement('dynamic-datalist');
		emptyElement.setAttribute('endpoint', '/api/test');
		document.body.appendChild(emptyElement);

		await new Promise((resolve) => setTimeout(resolve, 10));
		expect(warnSpy).toHaveBeenCalledWith(
			expect.stringContaining('No input element found'),
		);

		document.body.removeChild(emptyElement);
		warnSpy.mockRestore();
	});

	it('should warn if no endpoint is specified', async () => {
		const warnSpy = vi.spyOn(console, 'warn');

		const noEndpointElement = document.createElement('dynamic-datalist');
		const testInput = document.createElement('input');
		noEndpointElement.appendChild(testInput);
		document.body.appendChild(noEndpointElement);

		await new Promise((resolve) => setTimeout(resolve, 10));
		expect(warnSpy).toHaveBeenCalledWith(
			expect.stringContaining('No endpoint attribute specified'),
		);

		document.body.removeChild(noEndpointElement);
		warnSpy.mockRestore();
	});

	it('should make GET request with correct parameters', async () => {
		vi.useRealTimers();
		document.body.removeChild(element);
		element = document.createElement('dynamic-datalist');
		element.setAttribute('endpoint', '/api/test');
		input = document.createElement('input');
		input.type = 'text';
		element.appendChild(input);
		document.body.appendChild(element);
		await new Promise((resolve) => {
			element.addEventListener('dynamic-datalist:ready', resolve, {
				once: true,
			});
		});
		await new Promise(requestAnimationFrame);

		const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
			ok: true,
			json: async () => ({ options: ['test1', 'test2'] }),
		});

		input.value = 'test';
		input.dispatchEvent(new KeyboardEvent('keyup', { which: 65 }));

		// Wait for debounce (250ms) and async work
		await new Promise((resolve) => setTimeout(resolve, 300));
		await Promise.resolve();
		await new Promise(requestAnimationFrame);

		expect(fetchSpy).toHaveBeenCalledWith('/api/test?query=test');
		fetchSpy.mockRestore();
	}, 15000);

	it('should make POST request with JSON body', async () => {
		vi.useRealTimers();
		document.body.removeChild(element);
		element = document.createElement('dynamic-datalist');
		element.setAttribute('endpoint', '/api/test');
		element.setAttribute('method', 'post');
		input = document.createElement('input');
		input.type = 'text';
		element.appendChild(input);
		document.body.appendChild(element);
		await new Promise((resolve) => {
			element.addEventListener('dynamic-datalist:ready', resolve, {
				once: true,
			});
		});
		await new Promise(requestAnimationFrame);

		const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
			ok: true,
			json: async () => ({ options: ['test1', 'test2'] }),
		});

		input.value = 'test';
		input.dispatchEvent(new KeyboardEvent('keyup', { which: 65 }));

		await new Promise((resolve) => setTimeout(resolve, 300));
		await Promise.resolve();
		await new Promise(requestAnimationFrame);

		expect(fetchSpy).toHaveBeenCalledWith('/api/test', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ query: 'test' }),
		});
		fetchSpy.mockRestore();
	}, 15000);

	it('should update datalist with fetched options', async () => {
		vi.useRealTimers();
		document.body.removeChild(element);
		element = document.createElement('dynamic-datalist');
		element.setAttribute('endpoint', '/api/test');
		input = document.createElement('input');
		input.type = 'text';
		element.appendChild(input);
		document.body.appendChild(element);
		await new Promise((resolve) => {
			element.addEventListener('dynamic-datalist:ready', resolve, {
				once: true,
			});
		});
		await new Promise(requestAnimationFrame);

		vi.spyOn(global, 'fetch').mockResolvedValue({
			ok: true,
			json: async () => ({ options: ['option1', 'option2', 'option3'] }),
		});

		const updateHandler = vi.fn();
		element.addEventListener('dynamic-datalist:update', updateHandler);

		input.value = 'test';
		input.dispatchEvent(new KeyboardEvent('keyup', { which: 65 }));

		await new Promise((resolve) => setTimeout(resolve, 300));
		await Promise.resolve();
		await new Promise(requestAnimationFrame);

		expect(element.__$datalist.children.length).toBe(3);
		expect(element.__$datalist.children[0].value).toBe('option1');
		expect(element.__$datalist.children[1].value).toBe('option2');
		expect(element.__$datalist.children[2].value).toBe('option3');
		expect(updateHandler).toHaveBeenCalled();
	}, 15000);

	it('should ignore arrow keys, tab, and enter', async () => {
		// Wait for any pending operations from previous tests
		await new Promise((resolve) => setTimeout(resolve, 100));

		// Create a fresh element for this test to avoid interference
		const testElement = document.createElement('dynamic-datalist');
		testElement.setAttribute('endpoint', '/api/ignore-test');

		const testInput = document.createElement('input');
		testInput.type = 'text';
		testElement.appendChild(testInput);
		document.body.appendChild(testElement);

		await new Promise((resolve) => setTimeout(resolve, 20));

		const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
			ok: true,
			json: async () => ({ options: [] }),
		});

		testInput.value = 'test';

		// Arrow up (keyCode 38)
		testInput.dispatchEvent(
			new KeyboardEvent('keyup', { keyCode: 38, which: 38 }),
		);
		// Arrow down (keyCode 40)
		testInput.dispatchEvent(
			new KeyboardEvent('keyup', { keyCode: 40, which: 40 }),
		);
		// Tab (keyCode 9)
		testInput.dispatchEvent(
			new KeyboardEvent('keyup', { keyCode: 9, which: 9 }),
		);
		// Enter (keyCode 13)
		testInput.dispatchEvent(
			new KeyboardEvent('keyup', { keyCode: 13, which: 13 }),
		);

		await new Promise((resolve) => setTimeout(resolve, 20));

		// Filter calls to only those to our test endpoint
		const relevantCalls = fetchSpy.mock.calls.filter(
			(call) => call[0] && call[0].includes('/api/ignore-test'),
		);

		expect(relevantCalls.length).toBe(0);

		document.body.removeChild(testElement);
		fetchSpy.mockRestore();
	});

	it('should emit error event on fetch failure', async () => {
		vi.useRealTimers();
		document.body.removeChild(element);
		element = document.createElement('dynamic-datalist');
		element.setAttribute('endpoint', '/api/test');
		input = document.createElement('input');
		input.type = 'text';
		element.appendChild(input);
		document.body.appendChild(element);
		await new Promise((resolve) => {
			element.addEventListener('dynamic-datalist:ready', resolve, {
				once: true,
			});
		});
		await new Promise(requestAnimationFrame);

		vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'));

		const errorHandler = vi.fn();
		element.addEventListener('dynamic-datalist:error', errorHandler);

		input.value = 'test';
		input.dispatchEvent(new KeyboardEvent('keyup', { which: 65 }));

		await new Promise((resolve) => setTimeout(resolve, 300));
		await Promise.resolve();
		await new Promise(requestAnimationFrame);

		expect(errorHandler).toHaveBeenCalled();
		expect(errorHandler.mock.calls[0][0].detail.error.message).toBe(
			'Network error',
		);
	}, 15000);

	it('should clean up event listeners on disconnect', async () => {
		await new Promise((resolve) => setTimeout(resolve, 10));

		const removeEventListenerSpy = vi.spyOn(input, 'removeEventListener');

		element.remove();

		expect(removeEventListenerSpy).toHaveBeenCalledWith(
			'keyup',
			element.__boundHandleKeyup,
		);

		removeEventListenerSpy.mockRestore();
	});
	describe('Property Reflection', () => {
		describe('endpoint property', () => {
			it('should reflect attribute to property', () => {
				element.setAttribute('endpoint', '/api/reflect-test');
				expect(element.endpoint).toBe('/api/reflect-test');
			});

			it('should reflect property to attribute', () => {
				element.endpoint = '/api/property-test';
				expect(element.getAttribute('endpoint')).toBe(
					'/api/property-test',
				);
			});

			it('should remove attribute when property set to null', () => {
				element.endpoint = '/api/test';
				expect(element.hasAttribute('endpoint')).toBe(true);

				element.endpoint = null;
				expect(element.hasAttribute('endpoint')).toBe(false);
			});

			it('should remove attribute when property set to undefined', () => {
				element.endpoint = '/api/test';
				expect(element.hasAttribute('endpoint')).toBe(true);

				element.endpoint = undefined;
				expect(element.hasAttribute('endpoint')).toBe(false);
			});
		});

		describe('method property', () => {
			it('should reflect attribute to property', () => {
				element.setAttribute('method', 'post');
				expect(element.method).toBe('post');
			});

			it('should reflect property to attribute', () => {
				element.method = 'post';
				expect(element.getAttribute('method')).toBe('post');
			});

			it('should default to "get" when attribute not set', () => {
				element.removeAttribute('method');
				expect(element.method).toBe('get');
			});

			it('should remove attribute when property set to null', () => {
				element.method = 'post';
				expect(element.hasAttribute('method')).toBe(true);

				element.method = null;
				expect(element.hasAttribute('method')).toBe(false);
			});

			it('should remove attribute when property set to undefined', () => {
				element.method = 'post';
				expect(element.hasAttribute('method')).toBe(true);

				element.method = undefined;
				expect(element.hasAttribute('method')).toBe(false);
			});
		});

		describe('key property', () => {
			it('should reflect attribute to property', () => {
				element.setAttribute('key', 'search');
				expect(element.key).toBe('search');
			});

			it('should reflect property to attribute', () => {
				element.key = 'term';
				expect(element.getAttribute('key')).toBe('term');
			});

			it('should default to "query" when attribute not set', () => {
				element.removeAttribute('key');
				expect(element.key).toBe('query');
			});

			it('should remove attribute when property set to null', () => {
				element.key = 'search';
				expect(element.hasAttribute('key')).toBe(true);

				element.key = null;
				expect(element.hasAttribute('key')).toBe(false);
			});

			it('should remove attribute when property set to undefined', () => {
				element.key = 'search';
				expect(element.hasAttribute('key')).toBe(true);

				element.key = undefined;
				expect(element.hasAttribute('key')).toBe(false);
			});
		});
	});
});

describe('Lazy Property Upgrade', () => {
	it('should preserve endpoint property set before element connection', () => {
		// Create an element but don't connect it yet
		const uninitializedElement = document.createElement('dynamic-datalist');

		// Set property before connecting (simulates framework setting property before upgrade)
		uninitializedElement.endpoint = '/api/early-set';

		// Now connect it
		document.body.appendChild(uninitializedElement);

		// Property should be preserved
		expect(uninitializedElement.endpoint).toBe('/api/early-set');
		expect(uninitializedElement.getAttribute('endpoint')).toBe(
			'/api/early-set',
		);

		uninitializedElement.remove();
	});

	it('should preserve method property set before element connection', () => {
		const uninitializedElement = document.createElement('dynamic-datalist');

		uninitializedElement.method = 'post';

		document.body.appendChild(uninitializedElement);

		expect(uninitializedElement.method).toBe('post');
		expect(uninitializedElement.getAttribute('method')).toBe('post');

		uninitializedElement.remove();
	});

	it('should preserve key property set before element connection', () => {
		const uninitializedElement = document.createElement('dynamic-datalist');

		uninitializedElement.key = 'search';

		document.body.appendChild(uninitializedElement);

		expect(uninitializedElement.key).toBe('search');
		expect(uninitializedElement.getAttribute('key')).toBe('search');

		uninitializedElement.remove();
	});

	it('should handle multiple properties set before connection', () => {
		const uninitializedElement = document.createElement('dynamic-datalist');

		// Set multiple properties before connecting
		uninitializedElement.endpoint = '/api/multi-test';
		uninitializedElement.method = 'post';
		uninitializedElement.key = 'term';

		document.body.appendChild(uninitializedElement);

		// All properties should be preserved
		expect(uninitializedElement.endpoint).toBe('/api/multi-test');
		expect(uninitializedElement.getAttribute('endpoint')).toBe(
			'/api/multi-test',
		);
		expect(uninitializedElement.method).toBe('post');
		expect(uninitializedElement.getAttribute('method')).toBe('post');
		expect(uninitializedElement.key).toBe('term');
		expect(uninitializedElement.getAttribute('key')).toBe('term');

		uninitializedElement.remove();
	});
});
