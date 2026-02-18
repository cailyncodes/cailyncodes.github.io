import path from "node:path";
import { generateContent } from "./content-generator.lib.mjs";

const PROJECTS_DIR = path.resolve("content/projects");
const CONTENT_DIR = path.resolve("content");

// Type display names mapping
const TYPE_DISPLAY_NAMES = {
  "project": "Projects",
  "adventure": "Adventures",
  "creative": "Creative",
  "employment": "Employment"
};

// Order in which types should appear
const TYPE_ORDER = ["creative", "adventure", "project", "employment"];

// Run the generator
generateContent({
  name: "projects",
  sourceDir: PROJECTS_DIR,
  contentDir: CONTENT_DIR,
  typeOrder: TYPE_ORDER,
  typeDisplayNames: TYPE_DISPLAY_NAMES,
  requiredFields: ["title", "type"],
  sortBy: "priority",
  homeTemplate: "home-projects.md",
  listTemplate: "projects.md",
  homeOutput: "home-projects.md",
  listOutput: "projects.md",
  baseUrl: "/projects",
  categoryName: "projects",
  scriptName: "generate-projects.mjs"
}).catch(err => {
  console.error("Error generating project pages:", err);
  process.exit(1);
});
