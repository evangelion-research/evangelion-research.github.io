# evangelion-research.github.io

Hugo site for **Evangelion Research**, an interpretability lab studying mechanistic
interpretability through formal reasoning and programming languages research.

Dark theme by default (terminal/brutalist, EVA orange + terminal lime), with a light mode
toggle stored in `localStorage` and applied before first paint.

## Structure

```text
content/
  _index.md                  home page thesis
  research/                  standing research threads (one file per thread)
  notes/                     lab notes (page bundles; current post: emerald)
  papers/_index.md           intro copy; the list itself comes from data/papers.yaml
  lab/_index.md              intro copy; people + open problems from data/people.yaml
data/
  papers.yaml                publications and preprints
  people.yaml                members and open problems
layouts/
  _default/{baseof,list,single}.html
  index.html                 home page
  papers/list.html           year-grouped publication list
  lab/list.html              people + open problems
  partials/                  head, header, footer, mark, post-list, paper-list, scripts
  shortcodes/                sidenote, marginnote, spec, terminal
assets/
  css/eva.css                the whole theme
  js/eva.js                  theme toggle, scroll reveal, UTC clock
```

## Authoring

New research thread:

```shell
hugo new content research/my-thread.md
```

Front matter used by the layouts: `code` (e.g. `THR-05`), `weight` (ordering), `status`,
`excerpt`, `methods` (shown as tags), `tags`.

New lab note (page bundle so images can live next to the text):

```shell
hugo new content notes/my-note/index.md
```

Front matter: `date`, `status`, `excerpt`, `tags`, `authors`.

Shortcodes:

```text
{{< sidenote >}}Margin note with an auto number.{{< /sidenote >}}
{{< marginnote >}}Margin note without a number.{{< /marginnote >}}
{{< spec title="Soundness condition" >}}α(f(S)) ⊑ f#(α(S)){{< /spec >}}
{{< terminal title="shell" >}}hugo server{{< /terminal >}}
```

Papers and people are data-driven: edit `data/papers.yaml` and `data/people.yaml` rather
than adding content files.

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
