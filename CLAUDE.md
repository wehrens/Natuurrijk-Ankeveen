# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Natuurrijk Ankeveen is a static website for a Dutch volunteer working group focused on biodiversity in Ankeveen village. The site is hosted on Cloudflare and uses vanilla HTML, CSS, and JavaScript with no build tools or frameworks.

## Architecture

### Page Structure
- **index.html** - Homepage (hero, activities incl. swallow highlight, weetje, news, team, partners)
- **Activity pages** - Separate detail pages for each project (zeisbrigade.html, zwaluwen.html, oevers.html, bergsepad.html, aanplanten.html, educatie.html, ruige-hoek.html)

### Animated "Biotoop" Header System
- **biotoop.css** – fixed layers (background, pond, grass, ground, garden, sky, front) sharing one coordinate system.
- **biotoop.js** – all motion via the Web Animations API (transform/opacity only). Scenes per page are selected with
  `<script src="biotoop.js" data-scene="home|zeisbrigade|oevers|bergsepad|zwaluwen|aanplanten|educatie">`.
  Pauses when the tab is hidden; respects `prefers-reduced-motion` (static scene).
- Shared page chrome: `site.css` (styles) and `site.js` (menu, contact modal, lightbox).

### Email Protection
Cloudflare automatically obfuscates email addresses in HTML. The `email-protection.js` script bypasses this by dynamically building email addresses from parts that Cloudflare cannot detect. Use data attributes:
- `data-email="key"` - Sets only the mailto href
- `data-email-text="key"` - Sets only the visible text
- `data-email-full="key"` - Sets both href and text

Available keys: `info` (natuurrijkankeveen@protonmail.com), `ron` (r.wehrens@phasuma.com)

## Adding a New Page

1. Copy structure from an existing activity page
2. Include `fonts/fonts.css`, `site.css` and `biotoop.css` in the head
3. Include `site.js`, `email-protection.js` and `biotoop.js` (with `data-scene`) before `</body>`
4. Keep the `bio-*` container divs directly after the nav

## Key Files

| File | Purpose |
|------|---------|
| EMAIL-PROTECTION-README.md | Dutch documentation for the email protection system |

## URLs

- **Production:** https://natuurrijkankeveen.nl
- **Local:** http://localhost:8000 (start with `/s` slash command)

## Language

All content and user-facing documentation is in Dutch. Technical comments may be in English.
