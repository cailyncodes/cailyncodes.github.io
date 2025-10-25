// Process promises in completion order
async function* allInCompletionOrder(promises) {
  const pending = promises.map((p, i) =>
    (async () => {
      try { return { i, value: await p }; }
      catch { /* swallow or rethrow below */ }
    })()
  );

  const inFlight = new Set(pending);

  while (inFlight.size) {
    const res = await Promise.race(inFlight);
    inFlight.delete(pending[res.i]);
    if (res?.value !== undefined) yield res.value;
  }
}

// Dynamically determine content path based on tag name
// Convention: <x:something> loads content/something.md
// For nested directories, use dots: <x:projects.project1> loads content/projects/project1.md
function getContentPath(name) {
  if (name === 'home') {
    return '/home.md';
  }
  // Convert dots to directory separators for nested paths
  let path = name.replace(/\./g, '/');
  if (path.startsWith('/')) {
    path = path.slice(1);
  }
  return `/content/${path}.md`;
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

// Simple markdown to HTML converter
function markdownToHtml(markdown) {
  let html = markdown;
  
  // Headers
  html = html.replace(/^#### (.*$)/gim, '<h4>$1</h4>');
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$\n?)/gim, '<h1>$1</h1>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, (_, text, url) => {
    const hasProtocol = /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(url);
    const target = hasProtocol ? ' target="_blank"' : '';
    return `<a href="${url}"${target}>${text}</a>`;
  });
  
  // Bold
  html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');

  // Italic
  html = html.replace(/__(.*?)__/gim, '<em>$1</em>');
  
  // Unordered lists (with nesting support)
  html = html.replace(/^[^\\]([ \t]*[\-+] .+$\n?)+/gim, (match) => {
    const lines = match.trim().split('\n');
    let result = '';
    let prevIndent = 0;
    
    lines.forEach((line, index) => {
      // Calculate indentation level (spaces or tabs before the marker)
      const indentMatch = line.match(/^([ \t]*)/);
      const indent = indentMatch ? Math.floor(indentMatch[1].length / 2) : 0;
      
      // Extract content after the list marker
      const content = line.replace(/^[ \t]*[\-+] /, '').trim();
      
      // Handle nesting based on indent changes
      if (indent > prevIndent) {
        // Opening nested list
        for (let i = 0; i < (indent - prevIndent); i++) {
          result += '<ul>';
        }
      } else if (indent < prevIndent) {
        // Closing nested lists
        for (let i = 0; i < (prevIndent - indent); i++) {
          result += '</li></ul>';
        }
        result += '</li>';
      } else if (index > 0) {
        // Same level, close previous item
        result += '</li>';
      }
      
      result += `<li>${content}`;
      prevIndent = indent;
    });
    
    // Close remaining open tags
    result += '</li>';
    for (let i = 0; i < prevIndent; i++) {
      result += '</ul></li>';
    }
    
    return `<ul>${result}</ul>`;
  });
  
  // Remove trailing newline
  if (html.endsWith('\n')) {
    html = html.slice(0, -1);
  }
  // Line breaks
  html = html.replace(/\n\n/g, '</p><p>');
  html = html.replace(/\n/g, '<br>');

  // Wrap in paragraph if not already wrapped
  if (!html.startsWith('<h') && !html.startsWith('<p')) {
    html = '<p>' + html + '</p>';
  }

  // Remove escape characters
  html = html.replace(/\\/g, '');
  
  return html;
}

// Shared function to fetch and process markdown files
async function fetchAndProcessMarkdown(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Could not load: ${path} (status: ${response.status})`);
  }
  
  let markdown = await response.text();
  markdown = await processImports(markdown);
  const { metadata, content } = parseFrontMatter(markdown);
  const html = markdownToHtml(content);
  
  return { metadata, html };
}

// Load and insert markdown content
async function loadContent(pathname) {
  if (pathname === '' || pathname === '/') {
    pathname = 'home';
  }

  // Fetch initial content and layout
  const contentPath = getContentPath(pathname);
  const { metadata, html: contentHtml } = await fetchAndProcessMarkdown(contentPath);

  // Fetch layout and parse it into a DOM object
  const layoutName = metadata.layout || 'default';
  const layoutHtml = await loadLayout(layoutName);

  const page = new DOMParser().parseFromString(layoutHtml, 'text/html');

  // Find all elements in the DOM that match x:* pattern
  // Browsers create actual DOM elements for these, even if they're unknown tags
  const allElements = page.querySelectorAll('*');
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

  // create an array of promises that are resolved when the inner promises are resolved
  const tasks = xElements
  .map(({ element, name }) =>
    fetchAndProcessMarkdown(getContentPath(name))
    .then(result => ({element, name, content: result}))
  );

  // Load and replace each element
  for await (const { element, name, content } of allInCompletionOrder(tasks)) {
    const { html } = content;
    const contentPath = getContentPath(name);
    
    try {
      // Create a wrapper div
      const wrapper = page.createElement('div');
      wrapper.className = `content-${name}`;
      wrapper.innerHTML = html;
      
      // Replace the custom element with the wrapper
      element.parentNode.replaceChild(wrapper, element);
    } catch (error) {
      console.error(`Error loading ${contentPath}:`, error);
    }
  }

  // Then inject the content into the #content-body element
  const contentBody = page.getElementById('content-body');
  if (contentBody) {
    contentBody.innerHTML = contentHtml;
  } else {
    // Intended for home page layout
    console.log('No #content-body element found in layout');
  }
  
  const title = metadata.title ? `${metadata.title} - Cailyn Hansen` : 'Cailyn Hansen';

  return {page, title};
}

// Load layout HTML
async function loadLayout(layoutName) {
  const layoutPath = `/layout/${layoutName}.html`;
  
  try {
    const response = await fetch(layoutPath);
    if (response.ok) {
      console.log(`Loaded layout: ${layoutPath}`);
      return await response.text();
    } else {
      console.warn(`Could not load layout: ${layoutPath}, using default`);
      // Fallback to trying the default layout
      if (layoutName !== 'default') {
        return await loadLayout('default');
      }
      // Fallback to empty layout
      return '<div id="content-body"></div>';
    }
  } catch (error) {
    console.error(`Error loading layout ${layoutPath}:`, error);
    return '<div id="content-body"></div>';
  }
}

// Initialize the page
async function initializePage() {
  const pathname = window.location.pathname;
  const main = document.querySelector('main');
  
  if (!main) {
    console.error('No main element found');
    return;
  }
  
  try {
    const { page, title } = await loadContent(pathname);
    document.title = title;
    main.replaceChildren(...page.body.children);
  } catch (error) {
    console.error('Error initializing page:', error);
    window.location.replace('/not-found.html');
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
