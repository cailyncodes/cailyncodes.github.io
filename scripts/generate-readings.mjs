import path from "node:path";
import { generateContent } from "./content-generator.lib.mjs";

const READINGS_DIR = path.resolve("content/readings");
const CONTENT_DIR = path.resolve("content");

// Type display names mapping
const TYPE_DISPLAY_NAMES = {
  "novel": "Novels",
  "nonfiction": "Nonfiction",
  "article": "Articles",
  "short-story": "Short Stories"
};

// Order in which types should appear
const TYPE_ORDER = ["novel", "nonfiction", "article", "short-story"];

// Run the generator
generateContent({
  name: "readings",
  sourceDir: READINGS_DIR,
  contentDir: CONTENT_DIR,
  typeOrder: TYPE_ORDER,
  typeDisplayNames: TYPE_DISPLAY_NAMES,
  requiredFields: ["title", "author", "date"],
  sortBy: "date",
  homeTemplate: "home-reading.md",
  listTemplate: "reading.md",
  homeOutput: "home-reading.md",
  listOutput: "reading.md",
  baseUrl: "/readings",
  categoryName: "readings",
  scriptName: "generate-readings.mjs"
}).catch(err => {
  console.error("Error generating reading pages:", err);
  process.exit(1);
});
