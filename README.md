# Thai Flashcards data

Public, generated data for the Thai Flashcards app.

- `cards.json` is the live topic-based dataset.
- `cards.schema.json` defines schema version 4.
- `scripts/generate-cards.mjs` deterministically converts the single-tab Flash Card Source export.
- Columns are resolved by normalized header name, never position.
- `entryType` is copied from the canonical `Entry type` column and validated against the five supported values.
- Thai, Paiboon+, natural-English, and literal-English examples must each contain exactly one `[marked span]`.
- The app removes marker brackets and visually highlights the marked span.
- No translation, inference, or rewriting occurs during JSON generation.

Live URL:

```
https://raw.githubusercontent.com/syntext/thai-flashcards/main/cards.json
```
