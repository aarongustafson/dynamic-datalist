// Type definitions for dynamic-datalist web component
// Project: dynamic-datalist
// Definitions by: Aaron Gustafson

export interface DynamicDatalistReadyDetail {
	input: HTMLInputElement;
	datalist: HTMLDataListElement;
}

export interface DynamicDatalistUpdateDetail
	extends DynamicDatalistReadyDetail {
	options: string[];
}

export interface DynamicDatalistErrorDetail extends DynamicDatalistReadyDetail {
	error: any;
}

export class DynamicDatalistElement extends HTMLElement {
	/**
	 * The endpoint URL for fetching datalist options.
	 */
	endpoint: string;
	/**
	 * The HTTP method for the request (get or post).
	 */
	method: string;
	/**
	 * The variable name for the query value in the request.
	 */
	key: string;

	addEventListener(
		type: 'dynamic-datalist:ready',
		listener: (event: CustomEvent<DynamicDatalistReadyDetail>) => void,
		options?: boolean | AddEventListenerOptions,
	): void;
	addEventListener(
		type: 'dynamic-datalist:update',
		listener: (event: CustomEvent<DynamicDatalistUpdateDetail>) => void,
		options?: boolean | AddEventListenerOptions,
	): void;
	addEventListener(
		type: 'dynamic-datalist:error',
		listener: (event: CustomEvent<DynamicDatalistErrorDetail>) => void,
		options?: boolean | AddEventListenerOptions,
	): void;
	addEventListener(
		type: string,
		listener: EventListenerOrEventListenerObject,
		options?: boolean | AddEventListenerOptions,
	): void;
}

declare global {
	interface HTMLElementTagNameMap {
		'dynamic-datalist': DynamicDatalistElement;
	}
}
