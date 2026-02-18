import fs from "node:fs/promises";
import path from "node:path";
import { glob } from "glob";

const TEMPLATES_DIR = path.resolve("templates");

// Parse front matter from markdown
export function parseFrontMatter(markdown) {
  const frontMatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = markdown.match(frontMatterRegex);
  
  if (!match) {
    return { metadata: {}, content: markdown };
  }
  
  const frontMatter = match[1];
  const metadata = {};
  
  frontMatter.split('\n').forEach(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.substring(0, colonIndex).trim();
      const value = line.substring(colonIndex + 1).trim();
      // Remove quotes if present
      metadata[key] = value.replace(/^["']|["']$/g, '');
    }
  });
  
  return { metadata };
}

// Load template file and replace placeholders
export async function renderTemplate(templateName, placeholders) {
  const templatePath = path.join(TEMPLATES_DIR, templateName);
  let template = await fs.readFile(templatePath, "utf8");
  
  for (const [key, value] of Object.entries(placeholders)) {
    template = template.replace(`{{${key}}}`, value);
  }
  
  return template;
}

// Generate list item for a single content item
function generateListItem(item, baseUrl) {
  let itemLine = `\\- [${item.title}](${baseUrl}/${item.filename})`;
  
  // Add author if present
  if (item.author) {
    itemLine += `\n__by ${item.author}__`;
  }
  
  // Add blurb import if blurb exists
  if (item.blurb) {
    itemLine += `\n@import(${item.categoryName}.${item.filename}#blurb)`;
  }
  
  return itemLine + "\n\n";
}

// Generate readings list (grouped by type)
export function generateGroupedList(items, typeOrder, typeDisplayNames, baseUrl, categoryName) {
  let content = "";
  
  // Group items by type
  const itemsByType = {};
  
  for (const item of items) {
    const type = item.type || "other";
    if (!itemsByType[type]) {
      itemsByType[type] = [];
    }
    itemsByType[type].push(item);
  }
  
  // Generate sections for each type in order
  for (const type of typeOrder) {
    if (itemsByType[type] && itemsByType[type].length > 0) {
      const displayName = typeDisplayNames[type] || type.charAt(0).toUpperCase() + type.slice(1);
      content += `### ${displayName}

`;
      
      for (const item of itemsByType[type]) {
        content += generateListItem({ ...item, categoryName }, baseUrl);
      }
    }
  }
  
  // Handle any unknown types
  const knownTypes = new Set(typeOrder);
  for (const type in itemsByType) {
    if (!knownTypes.has(type)) {
      const displayName = typeDisplayNames[type] || type.charAt(0).toUpperCase() + type.slice(1);
      content += `### ${displayName}

`;
      
      for (const item of itemsByType[type]) {
        content += generateListItem({ ...item, categoryName }, baseUrl);
      }
    }
  }
  
  return content.trim();
}

// Main generator function
export async function generateContent(config) {
  const {
    name,
    sourceDir,
    contentDir,
    typeOrder,
    typeDisplayNames,
    requiredFields,
    sortBy,
    homeTemplate,
    listTemplate,
    homeOutput,
    listOutput,
    baseUrl,
    categoryName,
    scriptName
  } = config;
  
  console.log(`Generating ${name} pages...`);
  
  // Find all content files (only in root of sourceDir, not subdirectories)
  const files = await glob("*.md", { cwd: sourceDir });
  
  if (files.length === 0) {
    console.log(`No ${name} files found.`);
    return;
  }
  
  console.log(`Found ${files.length} ${name} file(s).`);
  
  // Read and parse all files
  const items = [];
  
  for (const filename of files) {
    const filepath = path.join(sourceDir, filename);
    const fileContent = await fs.readFile(filepath, "utf8");
    const { metadata } = parseFrontMatter(fileContent);
    
    // Check required fields
    const missingFields = requiredFields.filter(field => !metadata[field]);
    if (missingFields.length > 0) {
      console.warn(`Skipping ${filename}: missing required front matter (${missingFields.join(', ')})`);
      continue;
    }
    
    items.push({
      filename: filename.replace('.md', ''),
      title: metadata.title,
      type: metadata.type || "other",
      blurb: metadata.blurb || "",
      // Include any additional fields from metadata
      ...metadata
    });
  }
  
  // Sort items
  const isDateSort = sortBy === "date";
  const isPrioritySort = sortBy === "priority";
  items.sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    if (isDateSort) {
      return new Date(bVal) - new Date(aVal);
    }
    if (isPrioritySort) {
      return Number(aVal) - Number(bVal); // Lowest priority number first
    }
    return String(aVal).localeCompare(String(bVal));
  });
  
  const sortOrder = isDateSort ? "(most recent first)" : (isPrioritySort ? "(by priority)" : "(alphabetically)");
  console.log(`${name} sorted by ${sortBy} ${sortOrder}:`);
  
  // Generate note comment (use relative paths)
  const sourceDirRel = sourceDir.replace(path.resolve("content") + "/", "");
  const note = `<!-- NOTE: This file is auto-generated by scripts/${scriptName} -->
<!-- Do not edit manually. Add new ${name} to content/${sourceDirRel}/ and run: npm run generate:content -->`;
  
  // Generate home content (most recent items)
  const homeItems = items.slice(0, 3);
  const homeContent = await generateHomeContent(homeItems, homeTemplate, baseUrl, categoryName, note);
  
  // Generate list content (all items grouped by type)
  const listContent = await generateListContent(items, typeOrder, typeDisplayNames, listTemplate, baseUrl, categoryName, note);
  
  // Write files
  await fs.writeFile(path.join(contentDir, homeOutput), homeContent, "utf8");
  console.log(`✓ Generated ${contentDir}/${homeOutput}`);
  
  await fs.writeFile(path.join(contentDir, listOutput), listContent, "utf8");
  console.log(`✓ Generated ${contentDir}/${listOutput}`);
  
  console.log(`\n✓ ${name} page generation complete!`);
}

// Generate home page content
async function generateHomeContent(items, template, baseUrl, categoryName, note) {
  const templateContent = await fs.readFile(path.join(TEMPLATES_DIR, template), "utf8");
  
  let itemsList = "";
  for (const item of items) {
    itemsList += generateListItem({ ...item, categoryName }, baseUrl);
  }
  
  // Insert note after front matter (after the closing ---)
  let content = templateContent.replace(/^---\n([\s\S]*?)^---$/m, `---\n$1---\n${note}`);
  return content.replace("{{items}}", itemsList.trim());
}

// Generate list page content
async function generateListContent(items, typeOrder, typeDisplayNames, template, baseUrl, categoryName, note) {
  const templateContent = await fs.readFile(path.join(TEMPLATES_DIR, template), "utf8");
  
  const itemsList = generateGroupedList(items, typeOrder, typeDisplayNames, baseUrl, categoryName);
  
  // Insert note after front matter (after the closing ---)
  let content = templateContent.replace(/^---\n([\s\S]*?)^---$/m, `---\n$1---\n${note}`);
  return content.replace("{{items}}", itemsList);
}
