# Globalne statystyki MądraAI

Strona GitHub Pages jest statyczna, więc sam `stats.js` nie może zapisać wspólnego licznika. Folder zawiera mały backend Cloudflare Workers z bazą D1.

## Jednorazowe uruchomienie

1. Zainstaluj Node.js, a potem narzędzie Cloudflare: `npm install -g wrangler`.
2. Zaloguj się: `wrangler login`.
3. W tym folderze utwórz bazę: `wrangler d1 create madraai-stats`.
4. Skopiuj zwrócone `database_id` do `wrangler.toml`, zastępując `WSTAW_ID_BAZY_D1`.
5. Utwórz tabelę: `wrangler d1 execute madraai-stats --remote --file=schema.sql`.
6. Wdróż backend: `wrangler deploy`.
7. W `../stats.js` wstaw otrzymany adres `workers.dev` w `API_BASE`.
8. Opublikuj pliki GitHub Pages ponownie.

Licznik przechowuje dzienną sumę pytań według czasu w Warszawie. Treść pytań nie jest wysyłana ani zapisywana. Endpoint jest publiczny, więc licznik należy traktować jako orientacyjny i możliwy do nadużycia.
