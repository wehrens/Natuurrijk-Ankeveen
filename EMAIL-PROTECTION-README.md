# Email Protection voor Cloudflare

## Het probleem
Cloudflare versleutelt automatisch alle email adressen in je HTML. 
Dit zorgt voor "[email protected]" als de JavaScript niet goed laadt.

## De oplossing
Het bestand `email-protection.js` bouwt email adressen dynamisch via JavaScript.
Cloudflare ziet geen email adressen in de HTML, dus kan ze niet versleutelen.

## Hoe te gebruiken

### Stap 1: Voeg het script toe aan elke pagina
Voeg dit toe VOOR je andere scripts, vlak voor </body>:

```html
<script src="email-protection.js"></script>
```

### Stap 2: Vervang email links

**Voor de footer credit:**
```html
<!-- OUD (wordt versleuteld door Cloudflare) -->
<a href="mailto:r.wehrens@phasuma.com">r.wehrens@phasuma.com</a>

<!-- NIEUW (werkt altijd) -->
<a data-email-full="ron" href="#">laden...</a>
```

**Voor contact modal email:**
```html
<!-- OUD -->
<a href="mailto:info@natuurrijkankeveen.nl" class="contact-option">
    <div class="contact-option-text"><strong>E-mail</strong><span>info@natuurrijkankeveen.nl</span></div>
</a>

<!-- NIEUW -->
<a data-email="info" href="#" class="contact-option">
    <div class="contact-option-text"><strong>E-mail</strong><span data-email-text="info">laden...</span></div>
</a>
```

### Stap 3: Verwijder Cloudflare email-decode script
Verwijder deze regel als die erin staat:
```html
<script data-cfasync="false" src="/cdn-cgi/scripts/5c5dd728/cloudflare-static/email-decode.min.js"></script>
```

## Beschikbare email keys

In email-protection.js staan deze emails gedefinieerd:
- `info` = info@natuurrijkankeveen.nl  
- `ron` = r.wehrens@phasuma.com

## Data attributen

- `data-email="key"` - Vult alleen de href met mailto:
- `data-email-text="key"` - Vult alleen de tekst
- `data-email-full="key"` - Vult zowel href als tekst

## Nieuwe email toevoegen

Open email-protection.js en voeg toe aan EMAILS:
```javascript
const EMAILS = {
    info: ['info', 'natuurrijkankeveen', 'nl'],
    ron: ['r.wehrens', 'phasuma', 'com'],
    nieuw: ['naam', 'domein', 'nl']  // Voeg hier toe
};
```
