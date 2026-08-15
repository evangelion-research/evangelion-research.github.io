# repurtum.github.io

Hugo research blog for Repurtum Research Lab, styled with a Tufte-inspired
reading layout.

## Content

Research notes live in:

```text
content/notes/
```

The first note is:

```text
content/notes/azul/index.md
```

Use the `sidenote` and `marginnote` shortcodes for Tufte-style annotations.

## Preview

```shell
hugo server --bind 127.0.0.1
```

Open:

```text
http://127.0.0.1:1313/
```

## Build

```shell
hugo --gc --minify
```

The static output is written to `public/`.

## Deploy

GitHub Pages deploys from `.github/workflows/deploy.yml` on every push to `main`.
You can also run the workflow manually from GitHub Actions.
