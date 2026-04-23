# Gameprints Lead Finder

Simple local MVP for finding college basketball posts on X without paying for the X API.

## What it does

- generates ready-to-open X search queries
- supports team, rivalry, and tournament search packs
- lets you save promising post URLs into a local shortlist
- stores shortlist data in browser `localStorage`

## How to run

Because this is a static app, you can open it directly:

1. Open [index.html](/Users/janmenge/Documents/New%20project/index.html)

If your browser blocks some features when opened as a file, start a tiny local server instead:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Suggested workflow

1. Select the teams you care about.
2. Pick a search mode.
3. Open the generated X searches in new tabs.
4. Review relevant posts manually.
5. Save strong candidates into the shortlist with notes for later poster matching.

## Publish on GitHub Pages

This repo is ready for GitHub Pages via GitHub Actions.

1. Add the GitHub remote if it is not set yet:

```bash
git remote add origin https://github.com/vonmengenstein/GameprintsTwitter.git
```

2. Commit and push:

```bash
git add .
git commit -m "Add Gameprints lead finder MVP"
git push -u origin main
```

3. In GitHub:
   - open `Settings`
   - open `Pages`
   - under `Source`, choose `GitHub Actions`

After the workflow finishes, the site will be published on your GitHub Pages URL for this repo.
