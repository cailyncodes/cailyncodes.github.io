// Simple markdown to HTML converter
function markdownToHtml(markdown) {
  let html = markdown;
  
  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$\n?)/gim, '<h1>$1</h1>');
  
  // Bold
  html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
  
  // Italic/Underline (markdown uses _ for italic)
  html = html.replace(/__(.*?)__/gim, '<em>$1</em>');
  html = html.replace(/_(.*?)_/gim, '<em>$1</em>');
  
  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, (_, text, url) => {
    const hasProtocol = /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(url);
    const target = hasProtocol ? ' target="_blank"' : '';
    return `<a href="${url}"${target}>${text}</a>`;
  });
  
  // Line breaks
  html = html.replace(/\n\n/g, '</p><p>');
  html = html.replace(/\n/g, '<br>');
  
  // Wrap in paragraph if not already wrapped
  if (!html.startsWith('<h') && !html.startsWith('<p')) {
    html = '<p>' + html + '</p>';
  }
  
  return html;
}

// Dynamically determine content path based on tag name
// Convention: <x:something> loads content/something.md
// For nested directories, use dots: <x:projects.project1> loads content/projects/project1.md
function getContentPath(name) {
  // Convert dots to directory separators for nested paths
  const path = name.replace(/\./g, '/');
  return `content/${path}.md`;
}

// Process markdown imports recursively
// Syntax: @import(filename) where filename uses dot notation for nested paths
async function processImports(markdown, visited = new Set()) {
  // Find all import statements: @import(filename)
  const importRegex = /@import\(([^)]+)\)/g;
  let match;
  let result = markdown;
  
  const imports = [];
  while ((match = importRegex.exec(markdown)) !== null) {
    imports.push({
      fullMatch: match[0],
      filename: match[1].trim()
    });
  }
  
  // Process each import
  for (const imp of imports) {
    const importPath = getContentPath(imp.filename);
    
    // Prevent circular dependencies
    if (visited.has(importPath)) {
      console.warn(`Circular import detected: ${importPath}`);
      result = result.replace(imp.fullMatch, `<!-- Circular import: ${imp.filename} -->`);
      continue;
    }
    
    visited.add(importPath);
    
    try {
      const response = await fetch(importPath);
      if (response.ok) {
        let importedContent = await response.text();
        // Recursively process imports in the imported file
        importedContent = await processImports(importedContent, new Set(visited));
        result = result.replace(imp.fullMatch, importedContent);
        console.log(`Imported: ${importPath}`);
      } else {
        console.warn(`Could not import: ${importPath} (status: ${response.status})`);
        result = result.replace(imp.fullMatch, `<!-- Import failed: ${imp.filename} -->`);
      }
    } catch (error) {
      console.error(`Error importing ${importPath}:`, error);
      result = result.replace(imp.fullMatch, `<!-- Import error: ${imp.filename} -->`);
    }
  }
  
  return result;
}

// Parse front matter from markdown
function parseFrontMatter(markdown) {
  const frontMatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = markdown.match(frontMatterRegex);
  
  if (!match) {
    return { metadata: {}, content: markdown };
  }
  
  const frontMatter = match[1];
  const content = match[2];
  const metadata = {};
  
  // Parse YAML-like front matter
  frontMatter.split('\n').forEach(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.substring(0, colonIndex).trim();
      const value = line.substring(colonIndex + 1).trim();
      metadata[key] = value;
    }
  });
  
  return { metadata, content };
}

// Load and insert markdown content
async function loadContent() {
  // Find all elements in the DOM that match x:* pattern
  // Browsers create actual DOM elements for these, even if they're unknown tags
  const allElements = document.querySelectorAll('*');
  const xElements = [];
  
  // Find elements whose tag name contains 'X:' (browsers may capitalize it)
  allElements.forEach(element => {
    const tagName = element.tagName;
    if (tagName.includes(':')) {
      const [prefix, name] = tagName.split(':');
      if (prefix.toUpperCase() === 'X') {
        xElements.push({ element, name: name.toLowerCase() });
      }
    }
  });
  
  console.log('Found x: elements:', xElements);
  
  // Load and replace each element
  for (let { element, name } of xElements) {
    const contentPath = getContentPath(name);
    
    try {
      const response = await fetch(contentPath);
      console.log(`Fetching ${contentPath}:`, response);
      
      if (response.ok) {
        let markdown = await response.text();
        // Process any imports in the markdown
        markdown = await processImports(markdown);
        
        // Parse front matter and use only content
        const { content } = parseFrontMatter(markdown);
        const html = markdownToHtml(content);
        
        // Create a wrapper div
        const wrapper = document.createElement('div');
        wrapper.className = `content-${name}`;
        wrapper.innerHTML = html;
        
        // Replace the custom element with the wrapper
        element.parentNode.replaceChild(wrapper, element);
        console.log(`Replaced ${name} with content`);
      } else {
        console.warn(`Could not load content: ${contentPath} (status: ${response.status})`);
      }
    } catch (error) {
      console.error(`Error loading ${contentPath}:`, error);
    }
  }
}

// Store the original page content
let originalContent = null;
let originalContentLoaded = false;
let originalRawHTML = null; // The raw HTML from index.html before any processing

// Load layout HTML
async function loadLayout(layoutName) {
  const layoutPath = `layout/${layoutName}.html`;
  
  try {
    const response = await fetch(layoutPath);
    if (response.ok) {
      console.log(`Loaded layout: ${layoutPath}`);
      return await response.text();
    } else {
      console.warn(`Could not load layout: ${layoutPath}, using default`);
      // Fallback to default layout
      if (layoutName !== 'default') {
        return await loadLayout('default');
      }
      return '<div id="content-body"></div>';
    }
  } catch (error) {
    console.error(`Error loading layout ${layoutPath}:`, error);
    return '<div id="content-body"></div>';
  }
}

// Handle hash routing
async function handleRoute() {
  const hash = window.location.hash;
  const main = document.querySelector('main');
  
  if (!main) {
    console.error('No main element found');
    return;
  }
  
  // Check if hash starts with #content
  if (!hash || hash === "#" || !hash.startsWith('#content')) {
    // If we haven't loaded the original content yet, we need to load it
    if (!originalContentLoaded) {
      // Restore the original raw HTML from index.html
      main.innerHTML = originalRawHTML;
      // Load x: elements for home page
      await loadContent();
      // Store the rendered content
      originalContent = main.innerHTML;
      originalContentLoaded = true;
    } else if (originalContent) {
      // Restore original content (already rendered)
      main.innerHTML = originalContent;
    }
    document.title = 'Cailyn Hansen';
    console.log('Loaded/restored home page content');
    return;
  }
  
  // Extract the content path (e.g., #content/about -> about)
  const contentPath = hash.substring(9); // Remove '#content/'
  
  if (!contentPath) {
    console.warn('No content path specified');
    return;
  }
  
  // Convert path to markdown file path
  const mdPath = `content/${contentPath}.md`;
  
  try {
    const response = await fetch(mdPath);
    if (!response.ok) {
      console.error(`Could not load content: ${mdPath} (status: ${response.status})`);
      return;
    }
    
    let markdown = await response.text();
    
    // Process any imports
    markdown = await processImports(markdown);
    
    // Parse front matter
    const { metadata, content } = parseFrontMatter(markdown);
    
    // Get layout (default to 'default' if not specified)
    const layoutName = metadata.layout || 'default';
    const layoutHtml = await loadLayout(layoutName);
    
    // Convert markdown to HTML
    const contentHtml = markdownToHtml(content);
    
    // Replace the main element content with the layout
    main.innerHTML = layoutHtml;
    
    // Load any x: elements in the layout first
    await loadContent();
    
    // Then inject the content into the #content-body element
    const contentBody = document.getElementById('content-body');
    if (contentBody) {
      contentBody.innerHTML = contentHtml;
    } else {
      console.warn('No #content-body element found in layout');
      main.innerHTML = contentHtml;
    }
    
    // Update page title if specified
    if (metadata.title) {
      document.title = `${metadata.title} - Cailyn Hansen`;
    }
    
    console.log(`Loaded content: ${mdPath} with layout: ${layoutName}`);
  } catch (error) {
    console.error(`Error loading content ${mdPath}:`, error);
  }
}

// Listen for hash changes
window.addEventListener('hashchange', handleRoute);

// Initialize the page
async function initializePage() {
  const hash = window.location.hash;
  const main = document.querySelector('main');
  
  if (!main) {
    console.error('No main element found');
    return;
  }
  
  // Always store the raw HTML from index.html at the very start
  originalRawHTML = main.innerHTML;
  
  // If there's a hash route on initial load, handle it
  if (hash && hash.startsWith('#content') && hash !== '#content') {
    await handleRoute();
  } else {
    // Load standard x: elements for home page
    await loadContent();
    // Store the rendered content
    originalContent = main.innerHTML;
    originalContentLoaded = true;
  }
}

// Dark mode functionality
function initializeDarkMode() {
  const themeToggle = document.getElementById('theme-toggle');
  const themeToggleText = document.getElementById('theme-toggle-text');
  
  if (!themeToggle || !themeToggleText) {
    console.warn('Theme toggle elements not found');
    return;
  }
  
  // Check for saved theme preference or default to light mode
  const savedTheme = localStorage.getItem('theme') || 'light';
  
  // Apply the saved theme
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateToggleText(savedTheme, themeToggleText);
  
  // Toggle theme on button click
  themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateToggleText(newTheme, themeToggleText);
    
    console.log(`Theme switched to: ${newTheme}`);
  });
}

function updateToggleText(theme, element) {
  element.textContent = theme === 'dark' ? 'Light' : 'Dark';
}

// Run when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initializeDarkMode();
    initializePage();
  });
} else {
  console.log('DOM is ready');
  initializeDarkMode();
  initializePage();
}

