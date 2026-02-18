import path from "node:path";
import { generateContent } from "./content-generator.lib.mjs";

const WRITINGS_DIR = path.resolve("content/writings");
const CONTENT_DIR = path.resolve("content");

// Type display names mapping
const TYPE_DISPLAY_NAMES = {
  "essay": "Essays",
  "reflection": "Reflections"
};

// Order in which types should appear
const TYPE_ORDER = ["essay", "reflection"];

// Run the generator
generateContent({
  name: "writings",
  sourceDir: WRITINGS_DIR,
  contentDir: CONTENT_DIR,
  typeOrder: TYPE_ORDER,
  typeDisplayNames: TYPE_DISPLAY_NAMES,
  requiredFields: ["title", "type"],
  sortBy: "priority",
  homeTemplate: "home-writing.md",
  listTemplate: "writing.md",
  homeOutput: "home-writing.md",
  listOutput: "writing.md",
  baseUrl: "/writings",
  categoryName: "writings",
  scriptName: "generate-writings.mjs"
}).catch(err => {
  console.error("Error generating writing pages:", err);
  process.exit(1);
});
