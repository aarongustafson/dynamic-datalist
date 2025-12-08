# Dynamic `datalist` Web Component

[![npm version](https://img.shields.io/npm/v/@aarongustafson/dynamic-datalist.svg)](https://www.npmjs.com/package/@aarongustafson/dynamic-datalist) [![Build Status](https://img.shields.io/github/actions/workflow/status/aarongustafson/dynamic-datalist/ci.yml?branch=main)](https://github.com/aarongustafson/dynamic-datalist/actions)

Web component that enables you to dynamically update a field’s `datalist` with values retrieved from a URL as the user types

## Demo

[Live Demo](https://aarongustafson.github.io/dynamic-datalist/demo/) ([Source](./demo/index.html))

## Installation

```bash
npm install @aarongustafson/dynamic-datalist
```

## Usage

### Option 1: Import the class and define manually

Import the class and register the element with your preferred tag name:

```javascript
import { DynamicDatalistElement } from '@aarongustafson/dynamic-datalist';

customElements.define('my-datalist', DynamicDatalistElement);
```

### Option 2: Auto-define the custom element (browser environments only)

Use the guarded definition helper to register the element when `customElements` is available:

```javascript
import '@aarongustafson/dynamic-datalist/define.js';
```

If you prefer to control when the element is registered, call the helper directly:

```javascript
import { defineDynamicDatalist } from '@aarongustafson/dynamic-datalist/define.js';

defineDynamicDatalist();
```

You can also include the guarded script from HTML:

```html
<script src="./node_modules/@aarongustafson/dynamic-datalist/define.js" type="module"></script>
```

### Basic Example (GET Request)

Wrap an `input` element with `<dynamic-datalist>` and specify an endpoint:

```html
<dynamic-datalist endpoint="/api/search">
  <input type="text" name="search" placeholder="Type to search..." />
</dynamic-datalist>
```

This will make a GET request to `/api/search?query=WHAT_THE_USER_TYPED`.

### POST Request

```html
<dynamic-datalist endpoint="/api/search" method="post">
  <input type="text" name="search" placeholder="Type to search..." />
</dynamic-datalist>
```

This will make a POST request with JSON body: `{ "query": "WHAT_THE_USER_TYPED" }`.

### Custom Variable Name

```html
<dynamic-datalist endpoint="/api/search" key="term">
  <input type="text" name="search" placeholder="Type to search..." />
</dynamic-datalist>
```

This will send the query as `/api/search?term=WHAT_THE_USER_TYPED` (GET) or `{ "term": "..." }` (POST).

### Using Existing Datalist

If your input already has a datalist, the component will use and update it:

```html
<dynamic-datalist endpoint="/api/cities">
  <input type="text" list="cities-list" placeholder="Type a city..." />
  <datalist id="cities-list">
    <option>New York</option>
    <option>Los Angeles</option>
    <option>Los Angeles</option>
    <option>Chicago</option>
  </datalist>
</dynamic-datalist>
```

The component will preserve and update the existing datalist instead of creating a new one.

## API Response Format

Your endpoint should return JSON in this format:

```json
{
  "options": [
    "option 1",
    "option 2",
    "option 3"
  ]
}
```

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `endpoint` | `string` | (required) | URL to the JSON endpoint |
| `method` | `string` | `"get"` | HTTP method: `get` or `post` |
| `key` | `string` | `"query"` | Variable name for the query parameter |

## Events

The component fires custom events that you can listen to:

| Event | Description | Detail |
|-------|-------------|--------|
| `dynamic-datalist:ready` | Fired when component is initialized | `{ input, datalist }` |
| `dynamic-datalist:update` | Fired when datalist is updated | `{ input, datalist, options }` |
| `dynamic-datalist:error` | Fired when an error occurs | `{ input, datalist, error }` |

### Example Event Handling

```javascript
const element = document.querySelector('dynamic-datalist');

element.addEventListener('dynamic-datalist:update', (event) => {
  console.log('Received options:', event.detail.options);
});

element.addEventListener('dynamic-datalist:error', (event) => {
  console.error('Error fetching options:', event.detail.error);
});
```

## Import Options

### Auto-define (Recommended)

```javascript
import '@aarongustafson/dynamic-datalist/define.js';
// Registers <dynamic-datalist> when customElements is available
```

You can also call the helper manually:

```javascript
import { defineDynamicDatalist } from '@aarongustafson/dynamic-datalist/define.js';

defineDynamicDatalist();
```

### Manual Registration

```javascript
import { DynamicDatalistElement } from '@aarongustafson/dynamic-datalist';

customElements.define('my-datalist', DynamicDatalistElement);
```

## Browser Support

This component uses modern web standards:
- Custom Elements v1
- ES Modules
- Fetch API
- URLSearchParams

For older browsers, you may need polyfills.

## Migration from jQuery Plugin

This component replaces [my older jQuery plugin `jquery.easy-predictive-typing.js`](https://github.com/easy-designs/jquery.easy-predictive-typing.js).

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# View demo
open demo/index.html
```

## License

MIT © [Aaron Gustafson](https://www.aaron-gustafson.com/)
