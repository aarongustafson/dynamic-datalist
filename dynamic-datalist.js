/**
 * DynamicDatalistElement - Enables you to dynamically update a field’s `datalist` with values retrieved from a URL as the user types
 * 
 * @element dynamic-datalist
 * 
 * @attr {string} example-attribute - Description of the attribute
 * 
 * @fires dynamic-datalist:event-name - Description of the event
 * 
 * @slot - Default slot for content
 * 
 * @cssprop --component-name-color - Description of CSS custom property
 */
export class DynamicDatalistElement extends HTMLElement {
	static get observedAttributes() {
		return ['example-attribute'];
	}

	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
	}

	connectedCallback() {
		this.render();
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (oldValue !== newValue) {
			this.render();
		}
	}

	render() {
		this.shadowRoot.innerHTML = `
			<style>
				:host {
					display: block;
				}
			</style>
			<slot></slot>
		`;
	}
}
