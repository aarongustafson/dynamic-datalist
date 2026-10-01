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
 *  - bootstrap attribute
 *    Fetch options without a query after initialization
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
 * 	<dynamic-datalist endpoint="/foo/bar" bootstrap>
 * 		<input type="text" name="something"/>
 * 	</dynamic-datalist>
 * 	<!-- GET: /foo/bar on the first available frame -->
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
 * @attr {boolean} bootstrap - Fetch options without a query after initialization
 *
 * @fires dynamic-datalist:ready - Fired when the component is initialized
 * @fires dynamic-datalist:update - Fired when the datalist is updated with new options
 * @fires dynamic-datalist:error - Fired when an error occurs fetching options
 *
 * @slot - Default slot for the input element and optional datalist
 */
export class DynamicDatalistElement extends HTMLElement {
	static get observedAttributes() {
		return ['endpoint', 'method', 'key'];
	}

	attributeChangedCallback(name, oldValue, newValue) {
		// If the attribute changes, you may want to re-validate or re-initialize
		if (oldValue === newValue) return;

		switch (name) {
			case 'endpoint':
			case 'method':
			case 'key':
				// Optionally, re-validate or re-initialize if needed
				// For now, just emit an update event if the component is initialized
				if (this.__$input && this.__$datalist) {
					this.__emitEvent('update', {});
				}
				break;
		}
	}

	connectedCallback() {
		const connection = Symbol();
		this.__connection = connection;

		// Upgrade properties that may have been set before the element was defined
		this._upgradeProperty('endpoint');
		this._upgradeProperty('method');
		this._upgradeProperty('key');
		this._upgradeProperty('bootstrap');

		const shouldBootstrap = this.bootstrap;

		// Store references to input and datalist as properties
		Promise.resolve().then(() => {
			if (this.__connection !== connection) {
				return;
			}

			if (!this.__$input) {
				this.__$input = this.querySelector('input');
			}

			if (!this.__$input) {
				DynamicDatalistElement.__warn('No input element found');
				return;
			}
			this.__init(shouldBootstrap);
		});
	}

	disconnectedCallback() {
		this.__connection = undefined;

		if (this.__animationFrameId !== undefined) {
			cancelAnimationFrame(this.__animationFrameId);
			this.__animationFrameId = undefined;
		}

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

	/**
	 * Whether to fetch options without a query after initialization.
	 * Reflects between property and attribute to keep them in sync.
	 */
	get bootstrap() {
		return this.hasAttribute('bootstrap');
	}

	set bootstrap(value) {
		this.toggleAttribute('bootstrap', Boolean(value));
	}

	__createOrFindDatalist(shouldBootstrap) {
		// Only query if we don't already have a reference
		if (!this.__$input) {
			this.__$input = this.querySelector('input');
		}

		// Only add or update the list attribute on the input, never replace the input element
		this.__animationFrameId = requestAnimationFrame(() => {
			this.__animationFrameId = undefined;
			if (!this.__$input) return;
			const listId = this.__$input.getAttribute('list');
			let datalist = null;
			// 1. If the input has a list assigned and you find it, use that and end
			if (listId) {
				datalist = this.querySelector(`datalist#${CSS.escape(listId)}`);
				if (datalist) {
					this.__$datalist = datalist;
				}
			}
			// 2 & 3. If the input has a list assigned and you can't find it, or has no list, proceed
			// 4. If there is an unassigned datalist (no id), associate it
			if (!this.__$datalist) {
				datalist = Array.from(this.querySelectorAll('datalist')).find(
					(dl) => !dl.id,
				);
				if (datalist) {
					const newId = `dynamic-datalist-${Date.now()}-${Math.random().toString(36).slice(2)}`;
					datalist.id = newId;
					this.__$input.setAttribute('list', newId);
					this.__$datalist = datalist;
				}
			}
			// 5. If there is no unassigned datalist, create one
			if (!this.__$datalist) {
				const newId = `dynamic-datalist-${Date.now()}-${Math.random().toString(36).slice(2)}`;
				datalist = document.createElement('datalist');
				datalist.id = newId;
				this.appendChild(datalist);
				this.__$input.setAttribute('list', newId);
				this.__$datalist = datalist;
			}

			if (shouldBootstrap) {
				this.__fetchOptions();
			}
		});
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
		const hasQuery = query !== undefined;
		const payload = hasQuery ? { [this.key]: query } : undefined;

		try {
			let response;

			if (method === 'post') {
				const requestOptions = {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
				};
				if (hasQuery) {
					requestOptions.body = JSON.stringify(payload);
				}
				response = await fetch(this.endpoint, requestOptions);
			} else {
				const url = hasQuery
					? `${this.endpoint}?${new URLSearchParams(payload).toString()}`
					: this.endpoint;
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

	__valueMatchesOption(value) {
		if (!this.__$datalist || !value) {
			return false;
		}

		return Array.from(this.__$datalist.options).some(
			(option) => option.value === value,
		);
	}

	__handleKeyup(e) {
		const key = e.which || e.keyCode;

		// Ignore arrow keys, tab, and enter
		if (key === 38 || key === 40 || key === 9 || key === 13) {
			return;
		}

		const value = this.__$input.value;

		// Selecting an existing option (via mouse or keyboard) should not re-fetch
		if (this.__valueMatchesOption(value)) {
			clearTimeout(this.__debounceTimer);
			return;
		}

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

	__init(shouldBootstrap = false) {
		if (!this.__validateAttributes()) {
			return;
		}

		this.__createOrFindDatalist(shouldBootstrap);
		this.__addObservers();
		this.__emitEvent('ready');
	}
}
