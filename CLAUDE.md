# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Natuurrijk Ankeveen is a static website for a Dutch volunteer working group focused on biodiversity in Ankeveen village. The site is hosted on Cloudflare and uses vanilla HTML, CSS, and JavaScript with no build tools or frameworks.

## Architecture

### Page Structure
- **index.html** - Main homepage with all sections (hero, activities, results, team, sponsors)
- **Activity pages** - Separate detail pages for each project (zeisbrigade.html, zwaluwen.html, oevers.html, bergsepad.html, aanplanten.html, educatie.html, ruige-hoek.html)

### Animated "Biotoop" Header System
The site features an animated header with flowers, animals, and a pond. Each page can have its own biotoop theme:

- **garden.css** - Shared styles for all animated elements (flowers, animals, pond, swallows, etc.)
- **garden.js** - Main biotoop controller for the homepage
- **garden-{pagename}.js** - Page-specific biotoop scripts with custom choreography

The biotoop uses layered z-index containers:
- `header-background` (z-1000) - Background layer
- `header-pond` (z-1005) - Pond behind grass
- `header-grass` (z-1010) - Grass strip
- `header-animals-ground` (z-1025) - Walking animals (hedgehogs, caterpillars)
- `header-garden` (z-1035) - Flowers and plants
- `header-animals-flying` (z-1022) - Flying animals (swallows, butterflies)

### Email Protection
Cloudflare automatically obfuscates email addresses in HTML. The `email-protection.js` script bypasses this by dynamically building email addresses from parts that Cloudflare cannot detect. Use data attributes:
- `data-email="key"` - Sets only the mailto href
- `data-email-text="key"` - Sets only the visible text
- `data-email-full="key"` - Sets both href and text

Available keys: `info` (natuurrijkankeveen@protonmail.com), `ron` (r.wehrens@phasuma.com)

## Adding a New Page

1. Copy structure from an existing activity page
2. Include `garden.css` in the head
3. Include `email-protection.js` and the appropriate garden script before `</body>`
4. Add biotoop container elements (headerGarden, headerGrass, headerAnimalsGround, headerAnimalsFlying)

## Key Files

| File | Purpose |
|------|---------|
| GARDEN-TEMPLATE.html | Instructions for adding the garden to new pages |
| EMAIL-PROTECTION-README.md | Dutch documentation for the email protection system |
| ZOEK-VERVANG-SNIPPETS.txt | Find/replace snippets for common edits |

## URLs

- **Production:** https://natuurrijkankeveen.nl
- **Local:** http://localhost:8000 (start with `/s` slash command)

## Language

All content and user-facing documentation is in Dutch. Technical comments may be in English.
