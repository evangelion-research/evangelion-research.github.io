# evangelion-research.github.io

Hugo site for **Evangelion Research**, a research group studying mechanistic interpretability
through formal reasoning and programming languages research.

Built on the [Hyde](https://github.com/spf13/hyde) theme (in `themes/hyde/`) with project
overrides layered on top: a custom sidebar carrying the SEELE mark, a shared post-list
partial, and `assets/css/custom.css`, which Hyde concatenates into its CSS bundle
automatically.

## Structure

```text
content/
  _index.md                  home page thesis
  notes/                     posts (blog-style), one file per note
layouts/
  index.html                 home page — lists the notes section
  _default/{list,single}.html
  partials/
    sidebar.html             overrides the theme sidebar (logo + nav)
    page-list.html           title / date / excerpt list, used by index and list
  shortcodes/{spec,terminal}.html
assets/
  css/custom.css             project tweaks on top of Hyde
  evangelion-research.png    sidebar logo (processed by Hugo at build time)
themes/hyde/                 vendored theme
```

The site has a single content section, `notes/`. A `research/` section of standing threads
existed previously and has been removed, along with its navigation entry.

## Authoring

New note:

```shell
hugo new content notes/my-note.md
```

Front matter used by the layouts: `title`, `date`, `status` (shown in the byline),
`excerpt` (shown in list views), `tags`, `methods` (rendered as a trailing line), and
`code` (an optional identifier shown in the byline).

Shortcodes:

```text
{{< spec title="Soundness condition" >}}α(f(S)) ⊑ f#(α(S)){{< /spec >}}
{{< terminal title="shell" >}}hugo server{{< /terminal >}}
```

## Logo

`assets/evangelion-research.png` is white line work on a solid black field. The sidebar
renders it with `mix-blend-mode: lighten`, so the black field blends into the sidebar
background and only the line work shows — no transparent PNG needed. Replacing the file is
enough to change the mark; Hugo resizes it at build time.

## Develop

```shell
hugo server --bind 127.0.0.1
```

## Build

```shell
hugo --gc --minify --cleanDestinationDir
```

Output goes to `public/` (gitignored). GitHub Pages deploys from
`.github/workflows/deploy.yml` on every push to `main`.
