# Auto nabídka (statický web)

Moderní responzivní web pro prodej aut bez databáze. Všechny vozy se spravují pouze přes `data/cars.json` a složku s obrázky.

## Struktura

- `index.html` – seznam aut, filtry, řazení
- `car.html?id=CAR_ID` – detail vozu
- `assets/css/styles.css` – styly
- `assets/js/` – modulární JavaScript
- `data/cars.json` – zdroj dat
- `images/cars/<CAR_ID>/` – fotky vozů

## Jak přidat nové auto

1. Otevřete `data/cars.json`.
2. Přidejte nový objekt do pole dle existujícího formátu.
3. Vytvořte složku `images/cars/<CAR_ID>/`.
4. Nahrajte fotky a doplňte jejich relativní cesty do pole `images`.
5. Ujistěte se, že `id` je unikátní a bez mezer.

## Lokální spuštění

Doporučeno přes jednoduchý static server (kvůli `fetch`):

```bash
python -m http.server 8000
```

Pak otevřete:
- `http://localhost:8000/index.html`

## Nasazení

### Netlify
- Připojte repository.
- Build command: žádný.
- Publish directory: root projektu.

### GitHub Pages
- Pushněte kód do repozitáře.
- V nastavení Pages zvolte branch s projektem a root folder.

## Poznámky

- Bez backendu: formulář odesílá přes `mailto:` (fallback).
- Volitelně lze zapnout Formspree režim v `assets/js/carDetail.js` (`config.formMode`).
- Bonus funkce: Oblíbené (localStorage), Porovnání až 3 aut (otevření klávesou `P`), tiskový režim detailu.

## Správa inzerátů přes web (admin)

Na hlavní stránce klikněte na **Správa inzerátů** a zadejte heslo `MF123`.

- Přidání inzerátu: vyplňte formulář a potvrďte tlačítkem `Přidat inzerát`.
- Mazání inzerátu: v seznamu klikněte na `Smazat`.
- Změny se ukládají do **localStorage** prohlížeče (bez backendu).

> Pozn.: Pro trvalou správu mezi zařízeními je stále hlavní zdroj `data/cars.json`.

