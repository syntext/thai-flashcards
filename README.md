# Thai Flashcards data

Public, generated data for the Thai Flashcards app.

- `cards.json` is the live topic-based dataset.
- `cards.schema.json` defines schema version 2.
- `scripts/generate-cards.mjs` deterministically converts the single-tab Flash Card Source export.
- Columns are resolved by normalized header name, never position.
- No translation, inference, or rewriting occurs during JSON generation.

Live URL:

```
https://raw.githubusercontent.com/syntext/thai-flashcards/main/cards.json
```
