#!/usr/bin/env node
/**
 * Deterministically transforms exported Flash Card Source rows into cards.json.
 *
 * Input JSON:
 * {"tabs":[{"name":"04/08/26","rows":[["Category name","Thai word","Phonetic word","Example phrase"], ...]}]}
 *
 * This script performs no translation, inference, or rewriting.
 */
import fs from "node:fs";
import crypto from "node:crypto";

const inputPath = process.argv[2];
const outputPath = process.argv[3] || "cards.json";
if (!inputPath) throw new Error("Usage: node scripts/generate-cards.mjs <source-export.json> [cards.json]");

const input = JSON.parse(fs.readFileSync(inputPath, "utf8"));
if (!Array.isArray(input.tabs) || input.tabs.length === 0) throw new Error("Input must contain non-empty tabs[]");

const HEADERS = ["Category name", "Thai word", "Phonetic word", "Example phrase"];
const normalize = value => String(value ?? "").trim();
const slug = value => normalize(value).normalize("NFKD").replace(/[^\\p{L}\\p{N}]+/gu, "-").replace(/^-|-$/g, "").toLowerCase() || "deck";
const hash = value => crypto.createHash("sha256").update(value).digest("hex").slice(0, 12);

const decks = input.tabs.map((tab, deckPosition) => {
  const name = normalize(tab.name);
  if (!name || !Array.isArray(tab.rows) || tab.rows.length < 2) throw new Error(`Invalid tab at position ${deckPosition}`);
  const headers = tab.rows[0].map(normalize);
  const index = Object.fromEntries(HEADERS.map(header => [header, headers.findIndex(h => h.toLowerCase() === header.toLowerCase())]));
  for (const header of HEADERS) if (index[header] < 0) throw new Error(`Missing header "${header}" in tab "${name}"`);

  const seen = new Map();
  const cards = tab.rows.slice(1).filter(row => row.some(value => normalize(value))).map((row, position) => {
    const category = normalize(row[index["Category name"]]);
    const thai = normalize(row[index["Thai word"]]);
    const phonetic = normalize(row[index["Phonetic word"]]);
    const example = normalize(row[index["Example phrase"]]);
    if (![category, thai, phonetic, example].every(Boolean)) throw new Error(`Incomplete row ${position + 2} in tab "${name}"`);
    if (!example.includes(thai)) throw new Error(`Example does not contain Thai word at row ${position + 2} in tab "${name}"`);
    const identity = hash([name, category, thai].join("\\0"));
    const occurrence = (seen.get(identity) || 0) + 1;
    seen.set(identity, occurrence);
    return {id: `${slug(name)}-${identity}-${occurrence}`, category, english: category, structuredAs: category, thai, phonetic, example, position};
  });

  const ids = cards.map(card => card.id);
  if (new Set(ids).size !== ids.length) throw new Error(`Duplicate card IDs in tab "${name}"`);
  return {id: slug(name), name, position: deckPosition, cards};
});

const canonical = JSON.stringify({schemaVersion: 1, decks});
const output = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  sourceRevision: hash(canonical),
  sourceSpreadsheet: "Thai Flash Cards",
  decks
};
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2) + "\n");
