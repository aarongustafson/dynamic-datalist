import { describe, it, expect, beforeEach } from 'vitest';
import { DynamicDatalistElement } from '../dynamic-datalist.js';

describe('DynamicDatalistElement', () => {
	let element;

	beforeEach(() => {
		element = document.createElement('dynamic-datalist');
		document.body.appendChild(element);
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

	it('should have a shadow root', () => {
		expect(element.shadowRoot).toBeTruthy();
	});

	// Add more tests here
});
