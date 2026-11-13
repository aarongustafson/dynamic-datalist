# Dynamic `datalist` Web Component

[![npm version](https://img.shields.io/npm/v/@aarongustafson/dynamic-datalist.svg)](https://www.npmjs.com/package/@aarongustafson/dynamic-datalist)
[![CI status](https://img.shields.io/github/actions/workflow/status/aarongustafson/dynamic-datalist/ci.yml?branch=main&label=CI)](https://github.com/aarongustafson/dynamic-datalist/actions/workflows/ci.yml)
[![Minified + gzipped size](https://img.shields.io/bundlejs/size/@aarongustafson/dynamic-datalist?format=minzip&label=min%2Bgzip)](https://bundlejs.com/?q=@aarongustafson/dynamic-datalist)
[![License](https://img.shields.io/npm/l/@aarongustafson/dynamic-datalist)](https://github.com/aarongustafson/dynamic-datalist/blob/main/LICENSE)
[![Type definitions](https://img.shields.io/npm/types/@aarongustafson/dynamic-datalist)](https://github.com/aarongustafson/dynamic-datalist/blob/main/dynamic-datalist.d.ts)

Web component that enables you to dynamically update a field’s `datalist` with values retrieved from a URL as the user types

## Demos

- [Live Demo](https://aarongustafson.github.io/dynamic-datalist/demo/) ([Source](./demo/index.html))
- [Unpkg Demo](https://aarongustafson.github.io/dynamic-datalist/demo/unpkg.html) ([Source](./demo/unpkg.html))
- [ESM.sh Demo](https://aarongustafson.github.io/dynamic-datalist/demo/esm.html) ([Source](./demo/esm.html))

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
<script
  src="./node_modules/@aarongustafson/dynamic-datalist/define.js"
  type="module"
></script>
```

### Basic Example (GET Request)

Wrap an `input` element with `<dynamic-datalist>` and specify an endpoint:

```html
<dynamic-datalist endpoint="/api/search">
  <input type="text" name="search" placeholder="Type to search..." />
</dynamic-datalist>
```

This will make a GET request to `/api/search?query=WHAT_THE_USER_TYPED`.

### Bootstrap Options

Add the boolean `bootstrap` attribute to populate the datalist without waiting
for user interaction:

```html
<dynamic-datalist endpoint="/api/popular" bootstrap>
  <input type="text" name="search" placeholder="Search popular options..." />
</dynamic-datalist>
```

After the component and its datalist are initialized, it will make a GET
request to `/api/popular` on the first available animation frame. The request
does not include a query parameter. With `method="post"`, the component sends
a POST request with no body. Bootstrap results replace any existing datalist
options, just like results fetched after user input.

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
  "options": ["option 1", "option 2", "option 3"]
}
```

## Attributes

| Attribute   | Type      | Default    | Description                                        |
| ----------- | --------- | ---------- | -------------------------------------------------- |
| `endpoint`  | `string`  | (required) | URL to the JSON endpoint                           |
| `method`    | `string`  | `"get"`    | HTTP method: `get` or `post`                       |
| `key`       | `string`  | `"query"`  | Variable name for the query parameter              |
| `bootstrap` | `boolean` | `false`    | Fetch options without a query after initialization |

## Events

The component fires custom events that you can listen to:

| Event                     | Description                         | Detail                         |
| ------------------------- | ----------------------------------- | ------------------------------ |
| `dynamic-datalist:ready`  | Fired when component is initialized | `{ input, datalist }`          |
| `dynamic-datalist:update` | Fired when datalist is updated      | `{ input, datalist, options }` |
| `dynamic-datalist:error`  | Fired when an error occurs          | `{ input, datalist, error }`   |

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

## Demo styling and native fallbacks

The component doesn’t paint an input or suggestion menu. The browser owns the
native `input` and `datalist` behavior, including keyboard interaction, focus,
and platform-specific popup rendering. Keep an authored label for each input;
use `aria-describedby` to connect separate instructions.

The demos pair reading surfaces with `Canvas`/`CanvasText`, fields with
`Field`/`FieldText`, and code and buttons with `ButtonFace`/`ButtonText`.
Demo fields use a flat, solid foreground-colored border; native focus and
suggestion-menu rendering remain unchanged.
Supporting text inherits its surface’s foreground. The Canvas-backed footer
uses an 80% foreground mix where supported, with full-strength text in forced
colors and increased contrast. Native focus and automatic forced-color
adjustment remain enabled. The error log keeps its deliberate pale-red theme
with a complete dark-text/light-surface pair and an explicit “Error” label.
If you change a surface, check its text, links, boundaries, and focus together.

Without JavaScript or after a module failure, the inputs remain editable.
Authored datalists keep their initial suggestions. A successful response replaces
the list’s options; a failed request leaves the current value and options intact.
Demo messages and labels live in the authored HTML and scripts, so translate
them alongside your page. The component adds no visible labels.

Run `npm run test:browser` for single-worker Chromium, Firefox, and WebKit checks
of the three demo pages, light/dark layouts, recorded study palettes, keyboard
focus, failed imports, and no-JavaScript fallbacks. CDN checks wait for bootstrap
to replace the authored suggestion with fetched options. CDN imports are intercepted
with local source in these tests; they don’t verify CDN availability. These
checks don’t establish screen-reader support or native popup contrast in every
operating-system theme.

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

# Install browser engines, then run rendered demo checks
npx playwright install chromium firefox webkit
npm run test:browser

# Serve the demos at http://127.0.0.1:4186/demo/index.html
node scripts/serve.js
```

## License

MIT © [Aaron Gustafson](https://www.aaron-gustafson.com/)
