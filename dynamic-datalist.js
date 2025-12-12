/*! (c) Aaron Gustafson. MIT License. http://github.com/aarongustafson/dynamic-datalist */

/**
 * Dynamic Datalist Web Component
 *
 * This web component enables the dynamic creation of datalists using an API endpoint.
 * Wrap an input element with this component and configure via attributes:
 *
 *  - endpoint attribute
 *    A URL to the JSON endpoint
 *  - method attribute
 *    post or get (default: get)
 *  - key attribute
 *    The variable name you want the value sent as (default: query)
 *
 * Example(s):
 *
 * 	<dynamic-datalist endpoint="/foo/bar">
 * 		<input type="text" name="something"/>
 * 	</dynamic-datalist>
 * 	<!-- GET: /foo/bar?query=WHAT THE USER TYPED -->
 *
 * 	<dynamic-datalist endpoint="/foo/bar" method="post">
 * 		<input type="text" name="something"/>
 * 	</dynamic-datalist>
 * 	<!-- POST: /foo/bar { "query": "WHAT THE USER TYPED" } -->
 *
 * 	<dynamic-datalist endpoint="/foo/bar" key="my_custom_var">
 * 		<input type="text" name="something"/>
 * 	</dynamic-datalist>
 * 	<!-- GET: /foo/bar?my_custom_var=WHAT THE USER TYPED -->
 *
 * 	<dynamic-datalist endpoint="/foo/bar">
 * 		<input type="text" name="something" list="my-list"/>
 * 		<datalist id="my-list">
 * 			<option>Initial Option</option>
 * 		</datalist>
 * 	</dynamic-datalist>
 * 	<!-- Uses existing datalist instead of creating new one -->
 *
 *
 * The JSON response should follow this format:
 *
 * {
 * 		"options": [
 * 			"option 1",
 * 			"option 2",
 * 			"option 3"
 * 		]
 * }
 *
 * @element dynamic-datalist
 *
 * @attr {string} endpoint - URL to the JSON endpoint
 * @attr {string} method - HTTP method (get or post, default: get)
 * @attr {string} key - Variable name for the query value (default: query)
 *
 * @fires dynamic-datalist:ready - Fired when the component is initialized
 * @fires dynamic-datalist:update - Fired when the datalist is updated with new options
 * @fires dynamic-datalist:error - Fired when an error occurs fetching options
 *
 * @slot - Default slot for the input element and optional datalist
 */
export class DynamicDatalistElement extends HTMLElement {
	connectedCallback() {
		// Upgrade properties that may have been set before the element was defined
		this._upgradeProperty('endpoint');
		this._upgradeProperty('method');
		this._upgradeProperty('key');

		// Store references to input and datalist as properties
		Promise.resolve().then(() => {
			if (!this.__$input) {
				this.__$input = this.querySelector('input');
			}

			if (!this.__$input) {
				DynamicDatalistElement.__warn('No input element found');
				return;
			}
			this.__init();
		});
	}

	disconnectedCallback() {
		if (this.__$input) {
			this.__$input.removeEventListener('keyup', this.__boundHandleKeyup);
		}
	}

	static __warn(message) {
		console.warn(`<dynamic-datalist>: ${message}`);
	}

	/**
	 * Upgrade a property to handle cases where it was set before the element upgraded.
	 * This is especially important for framework compatibility.
	 * @param {string} prop - Property name to upgrade
	 * @private
	 */
	_upgradeProperty(prop) {
		if (Object.prototype.hasOwnProperty.call(this, prop)) {
			const value = this[prop];
			delete this[prop];
			this[prop] = value;
		}
	}

	/**
	 * Endpoint URL for fetching datalist options.
	 * Reflects between property and attribute to keep them in sync.
	 */
	get endpoint() {
		return this.getAttribute('endpoint');
	}

	set endpoint(value) {
		if (value === null || value === undefined) {
			this.removeAttribute('endpoint');
		} else {
			this.setAttribute('endpoint', value);
		}
	}

	/**
	 * HTTP method for the request (get or post).
	 * Reflects between property and attribute to keep them in sync.
	 * Defaults to 'get' if not specified.
	 */
	get method() {
		return this.getAttribute('method') || 'get';
	}

	set method(value) {
		if (value === null || value === undefined) {
			this.removeAttribute('method');
		} else {
			this.setAttribute('method', value);
		}
	}

	/**
	 * Variable name for the query value in the request.
	 * Reflects between property and attribute to keep them in sync.
	 * Defaults to 'query' if not specified.
	 */
	get key() {
		return this.getAttribute('key') || 'query';
	}

	set key(value) {
		if (value === null || value === undefined) {
			this.removeAttribute('key');
		} else {
			this.setAttribute('key', value);
		}
	}

	__createOrFindDatalist() {
		// Only query if we don't already have a reference
		if (!this.__$input) {
			this.__$input = this.querySelector('input');
		}

		// Check if input already has a datalist
		const existingListId = this.__$input.getAttribute('list');

		if (existingListId) {
			// Try to find existing datalist in the component or document
			if (!this.__$datalist) {
				this.__$datalist =
					this.querySelector(`#${existingListId}`) ||
					document.getElementById(existingListId);
			}
			if (this.__$datalist) {
				return;
			}
		}

		// Create a new datalist
		const id = `dynamic-datalist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
		this.__$datalist = document.createElement('datalist');
		this.__$datalist.id = id;
		this.appendChild(this.__$datalist);
		this.__$input.setAttribute('list', id);
	}

	__validateAttributes() {
		const allowedMethods = ['get', 'post'];

		if (!this.endpoint) {
			DynamicDatalistElement.__warn('No endpoint attribute specified');
			return false;
		}

		if (!allowedMethods.includes(this.method.toLowerCase())) {
			DynamicDatalistElement.__warn(
				`Invalid method "${this.method}". Using "get" instead.`,
			);
			// No need to set this.method, just fallback in usage
		}

		return true;
	}

	__emitEvent(type, detail = {}) {
		const event = new CustomEvent(`dynamic-datalist:${type}`, {
			detail: {
				input: this.__$input,
				datalist: this.__$datalist,
				...detail,
			},
		});
		this.dispatchEvent(event);
	}

	async __fetchOptions(query) {
		const method = this.method.toLowerCase();
		const payload = { [this.key]: query };

		try {
			let response;

			if (method === 'post') {
				response = await fetch(this.endpoint, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(payload),
				});
			} else {
				const params = new URLSearchParams(payload);
				const url = `${this.endpoint}?${params.toString()}`;
				response = await fetch(url);
			}

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data = await response.json();

			if (data.options && Array.isArray(data.options)) {
				this.__updateDatalist(data.options);
				this.__emitEvent('update', { options: data.options });
			}
		} catch (error) {
			DynamicDatalistElement.__warn(
				`Failed to fetch options: ${error.message}`,
			);
			this.__emitEvent('error', { error });
		}
	}

	__updateDatalist(options) {
		// Only update if we have a reference
		if (!this.__$datalist) return;

		// Clear existing options
		this.__$datalist.innerHTML = '';

		// Add new options
		options.forEach((value) => {
			const option = document.createElement('option');
			option.value = value;
			option.textContent = value;
			this.__$datalist.appendChild(option);
		});
	}

	__handleKeyup(e) {
		const key = e.which || e.keyCode;

		// Ignore arrow keys, tab, and enter
		if (key === 38 || key === 40 || key === 9 || key === 13) {
			return;
		}

		const value = this.__$input.value;

		// Debounce fetch calls
		clearTimeout(this.__debounceTimer);
		if (value) {
			this.__debounceTimer = setTimeout(() => {
				this.__fetchOptions(value);
			}, 250);
		}
	}

	__addObservers() {
		this.__boundHandleKeyup = this.__handleKeyup.bind(this);
		if (this.__$input) {
			this.__$input.addEventListener('keyup', this.__boundHandleKeyup);
		}
	}

	__init() {
		if (!this.__validateAttributes()) {
			return;
		}

		this.__createOrFindDatalist();
		this.__addObservers();
		this.__emitEvent('ready');
	}
}
