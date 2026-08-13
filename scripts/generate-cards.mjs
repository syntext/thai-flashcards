#!/usr/bin/env node
import fs from "node:fs";
const inputPath=process.argv[2],outputPath=process.argv[3]||"cards.json";
if(!inputPath)throw new Error("Usage: node scripts/generate-cards.mjs <source-export.json> [cards.json]");
const input=JSON.parse(fs.readFileSync(inputPath,"utf8")),rows=Array.isArray(input.rows)?input.rows:input.tabs?.[0]?.rows;
if(!Array.isArray(rows)||rows.length<2)throw new Error("Input must contain rows with a header row");
const REQUIRED=["Entry type","Topics","Thai word","Phonetic word","English word","Example phrase","Example phrase phonetic","English example phrase","Date added","Literal example phrase","Ignore"];
const ENTRY_TYPES=new Set(["Word","Expression","Particle","Structure","Word component"]);
const normalize=value=>String(value??"").trim(),headers=rows[0].map(normalize);
const normalizedHeaders=headers.map(header=>header.toLowerCase());
for(const header of REQUIRED){const matches=normalizedHeaders.filter(value=>value===header.toLowerCase()).length;if(matches!==1)throw new Error(`${matches?"Duplicated":"Missing"} header "${header}"`)}
const index=Object.fromEntries(REQUIRED.map(header=>[header,headers.findIndex(h=>h.toLowerCase()===header.toLowerCase())]));
const hash=value=>{let h=0xcbf29ce484222325n;for(let i=0;i<value.length;i++){const code=value.charCodeAt(i);h^=BigInt(code&255);h=BigInt.asUintN(64,h*0x100000001b3n);h^=BigInt(code>>>8);h=BigInt.asUintN(64,h*0x100000001b3n)}return h.toString(16).padStart(16,"0")};
const oneMarker=(value,row,label)=>{if((value.match(/\[/g)||[]).length!==1||(value.match(/\]/g)||[]).length!==1||!/^[^\[]*\[[^\[\]]+\][^\]]*$/.test(value))throw new Error(`${label} must contain exactly one [marked span] at row ${row}`)};
const seen=new Map(),exactRows=new Set(),topics=[],topicKeys=new Set();
const cards=rows.slice(1).filter(row=>row.some(value=>normalize(value))).filter(row=>!normalize(row[index["Ignore"]])).map((row,position)=>{
 const entryType=normalize(row[index["Entry type"]]);if(!ENTRY_TYPES.has(entryType))throw new Error(`Invalid Entry type at row ${position+2}`);
 const cardTopics=normalize(row[index["Topics"]]).split(",").map(normalize).filter(Boolean);if(!cardTopics.length)cardTopics.push("Generic");
 const thai=normalize(row[index["Thai word"]]),phonetic=normalize(row[index["Phonetic word"]]),english=normalize(row[index["English word"]]),exampleThai=normalize(row[index["Example phrase"]]),examplePhonetic=normalize(row[index["Example phrase phonetic"]]),exampleEnglish=normalize(row[index["English example phrase"]]),exampleLiteral=normalize(row[index["Literal example phrase"]]),dateAdded=normalize(row[index["Date added"]]);
 if(![thai,phonetic,english,exampleThai,examplePhonetic,exampleEnglish,exampleLiteral,dateAdded].every(Boolean))throw new Error(`Incomplete row ${position+2}`);
 oneMarker(exampleThai,position+2,"Example phrase");oneMarker(examplePhonetic,position+2,"Example phrase phonetic");oneMarker(exampleEnglish,position+2,"English example phrase");oneMarker(exampleLiteral,position+2,"Literal example phrase");
 if(exampleThai.match(/\[([^\]]+)\]/)?.[1]!==thai)throw new Error(`Thai marker must contain the exact Thai word at row ${position+2}`);
 if(!/^\d{4}-\d{2}-\d{2}$/.test(dateAdded))throw new Error(`Invalid Date added at row ${position+2}`);
 const exactKey=[entryType,...cardTopics,thai,phonetic,english,exampleThai,examplePhonetic,exampleEnglish,exampleLiteral,dateAdded].join("\0");if(exactRows.has(exactKey))throw new Error(`Duplicate card at row ${position+2}`);exactRows.add(exactKey);
 for(const topic of cardTopics){const key=topic.toLowerCase();if(!topicKeys.has(key)){topicKeys.add(key);topics.push(topic)}}
 const identity=hash([thai,phonetic,english].join("\0")),occurrence=(seen.get(identity)||0)+1;seen.set(identity,occurrence);
 return{id:`card-${identity}-${occurrence}`,entryType,topics:cardTopics,thai,phonetic,english,exampleThai,examplePhonetic,exampleEnglish,exampleLiteral,dateAdded,position};
});
const canonical=JSON.stringify({schemaVersion:4,topics,cards});
const output={schemaVersion:4,generatedAt:new Date().toISOString(),sourceRevision:hash(canonical),sourceSpreadsheet:"Thai Flash Cards",topics,cards};
fs.writeFileSync(outputPath,JSON.stringify(output,null,2)+"\n");
