# Thai Flashcards data

Public, generated data for the Thai Flashcards app.

- `cards.json` is the live dataset.
- `cards.schema.json` defines the fixed format.
- `scripts/generate-cards.mjs` deterministically converts an exported Flash Card Source workbook to JSON.
- The generator resolves columns by header name, never by column position.
- No LLM translation or rewriting occurs during JSON generation.

Live URL:

```
https://raw.githubusercontent.com/syntext/thai-flashcards/main/cards.json
```
