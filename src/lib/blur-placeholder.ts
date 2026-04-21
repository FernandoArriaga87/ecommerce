// Tiny gray SVG used as placeholder while <Image> loads.
// Matches the #F3F3F3 card background so the fade-in is seamless.
// Base64 is precomputed — keeping it as a module-level constant avoids
// re-encoding on every render and keeps this usable from both server and
// client components without a runtime Buffer/btoa branch.
export const BLUR_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA4IDEwIj48cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSIxMCIgZmlsbD0iI2YzZjNmMyIvPjwvc3ZnPg==";
