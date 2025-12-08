import { DynamicDatalistElement } from './dynamic-datalist.js';

export function defineDynamicDatalist(tagName = 'dynamic-datalist') {
	const hasWindow = typeof window !== 'undefined';
	const registry = hasWindow ? window.customElements : undefined;

	if (!registry || typeof registry.define !== 'function') {
		return false;
	}

	if (!registry.get(tagName)) {
		registry.define(tagName, DynamicDatalistElement);
	}

	return true;
}

defineDynamicDatalist();
