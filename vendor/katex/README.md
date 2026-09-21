# KaTeX 0.18.7

Vendored from the official npm package, https://www.npmjs.com/package/katex/v/0.18.7.
Licensed under MIT; see LICENSE.
Package SHA-256: `9a80a3fba2367e99bf67b52bfff52e9534c8c7f198e4eaa12699e4f1df9a0bda`.

`katex.js` is `dist/katex.mjs` minified as ESM using esbuild 0.25.9.
`katex.min.css` is the official stylesheet with legacy WOFF/TTF fallbacks removed;
all referenced WOFF2 fonts are included. The renderer, stylesheet, and fonts are
served from the same origin and precached for offline lessons. No CDN is used.

To rebuild the JavaScript:

```sh
esbuild dist/katex.mjs --minify --format=esm --outfile=katex.js
```
