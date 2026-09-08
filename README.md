# Natuurrijk Ankeveen

Website voor Werkgroep Natuurrijk Ankeveen - een groep vrijwilligers die zich inzet voor meer biodiversiteit in en om Ankeveen.

**Live site:** https://natuurrijkankeveen.nl

## Onze projecten

- **Zeisbrigade** - Bermen en veldjes maaien met de zeis voor bloemrijke vegetatie
- **Huiszwaluwbescherming** - Van 6 naar 70 nesten dankzij kunstnesten en een zwaluwtil
- **Natuurvriendelijke oevers** - Aanleg bij IJsclub, Bergse Pad en Buhrmanlaan
- **Onderhoud Bergse Pad** - In samenwerking met Waternet en Natuurmonumenten
- **Aanplanten** - Uitsluitend inheemse, biologisch gekweekte planten
- **Educatie** - Activiteiten met de Joseph Lokin school

## Technisch

Statische website met vanilla HTML, CSS en JavaScript. Gehost op GitHub Pages met Cloudflare.
Geen cookies, geen externe scripts behalve GoatCounter (cookieloze bezoekersteller); lettertypes lokaal in `fonts/`.

### Bestanden

| Bestand | Doel |
|---|---|
| `index.html` | Homepage |
| `zeisbrigade.html`, `oevers.html`, `bergsepad.html`, `zwaluwen.html`, `aanplanten.html`, `educatie.html`, `egels.html`, `ruige-hoek.html` | Projectpagina's |
| `site.css` | Gedeelde opmaak voor alle pagina's |
| `site.js` | Gedeeld: mobiel menu, contactvenster, lightbox |
| `biotoop.css`, `biotoop.js` | De levende header. Scène per pagina via `<script src="biotoop.js" data-scene="...">` |
| `email-protection.js` | Bouwt e-mailadressen op zodat Cloudflare ze niet verminkt |
| `images/` | Alle afbeeldingen, geoptimaliseerd als WebP (`images/weetjes/` = natuurweetjes) |

### Teksten aanpassen
- Zwaluwcijfers: zoek in `index.html` en `zwaluwen.html` naar "De telling van 2026".
- Nieuws: het blok `<section class="section alt" id="nieuws">` in `index.html`, nieuwste bovenaan.
- Vrijwilligers: de lijst `volunteers` in het script onderaan `index.html`.
- Natuurweetjes: de lijst `weetjesData` in hetzelfde script; foto's in `images/weetjes/`.
- Nieuwe foto's: verklein tot max. 1000 px en sla op als WebP.

De site bevat een geanimeerde "biotoop" header met bloemen, dieren en een vijver die tot leven komt terwijl je de pagina bekijkt.

### Lokaal draaien

```bash
python3 -m http.server 8000
```

Open http://localhost:8000

## Contact

- Email: natuurrijkankeveen@protonmail.com
- Telefoon: 06-46293590 (Ron Wehrens)

## Partners

Landschap Noord-Holland, Vogelwerkgroep 't Gooi, Gemeente Wijdemeren, Natuurmonumenten, Waternet, Joseph Lokin School, Ankeveense IJsclub, De Appelboom, Bruisend Ankeveen, Zorgkwekerij Kostelijk, Wijnand Smit Tuinen
