# Responsive Hero Focal Point Prototype

An interactive educational prototype for exploring how focal points affect
responsive `object-fit: cover` hero images.

## What it demonstrates

- A fluid viewport from **365px to 1276px**
- A fixed **600px** hero height
- Desktop and mobile images with independent focal points
- Two content layouts that reposition across responsive sizes
- A 3×3 focal point grid plus independent horizontal and vertical controls
- A focal-point crosshair and crop mini-map
- A **Min-specific image** comparison view
- Implementation notes for CSS, Tailwind, React, and CMS-backed projects

The prototype switches from a portrait mobile image to a landscape desktop
image at **1024px**.

## Run locally

This project uses pnpm.

```bash
pnpm install
pnpm dev
```

Open the local URL printed by Vite.

## Validate a change

```bash
pnpm typecheck
pnpm build
```

The production build is written to `dist/`. Vite uses relative asset paths, so
the generated site can be hosted from a GitHub Pages project subdirectory or
another static host.

## Project structure

```text
src/
  app/App.tsx       Interactive prototype and developer documentation
  main.tsx          Standalone Vite entry point
  styles/           Fonts, Tailwind imports, and theme tokens
```

`__figma__entrypoint__.ts` remains in the repository so the project can still
open in Figma Make. The standalone Vite entry point is `src/main.tsx`.

## Image credits

The demonstration photography is loaded from Unsplash. See
[`ATTRIBUTIONS.md`](./ATTRIBUTIONS.md) for attribution details.
