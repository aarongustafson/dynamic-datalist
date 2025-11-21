import { beforeAll } from 'vitest';
import { DynamicDatalistElement } from '../dynamic-datalist.js';

// Define the custom element before tests run
beforeAll(() => {
	if (!customElements.get('dynamic-datalist')) {
		customElements.define('dynamic-datalist', DynamicDatalistElement);
	}

	// Make the class available globally for testing static methods
	globalThis.DynamicDatalistElement = DynamicDatalistElement;
});
