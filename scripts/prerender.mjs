import http from "node:http";
import handler from "serve-handler";
import path from "node:path";
import fs from "node:fs/promises";
import { glob } from "glob";
import puppeteer from "puppeteer";

const DIST_DIR = path.resolve("dist");
const PORT = 8787;
const ORIGIN = `http://127.0.0.1:${PORT}`;

const server = http.createServer((req, res) => {
  // Custom handler to serve index.html for routes without file extensions
  // but allow static files (.js, .css, .md, etc.) to be served normally
  const url = new URL(req.url, `http://${req.headers.host}`);
  const hasExtension = /\.[a-zA-Z0-9]+$/.test(url.pathname);
  
  return handler(req, res, { 
    public: DIST_DIR,
    cleanUrls: false,
    trailingSlash: false,
    // Only rewrite routes without extensions (HTML pages)
    rewrites: hasExtension ? [] : [{ source: "**", destination: "/index.html" }]
  });
});

await new Promise(r => server.listen(PORT, r));

const browser = await puppeteer.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"]
});

try {
  const prerenderedPaths = new Set();

  // Save the original empty index.html for SPA routing
  const originalIndexPath = path.join(DIST_DIR, "index.html");
  const originalIndexHtml = await fs.readFile(originalIndexPath, "utf8");

  // Helper function to prerender a single page
  async function prerenderPage(urlPath) {
    if (prerenderedPaths.has(urlPath)) {
      console.log("Already prerendered:", urlPath);
      return null;
    }

    // For non-home pages, restore the original empty index.html before rendering
    // so the client-side rendering works correctly (server will serve empty index.html)
    // For the home page, we don't restore it (we want it to stay prerendered)
    if (urlPath !== '/' && urlPath !== '') {
      await fs.writeFile(originalIndexPath, originalIndexHtml, "utf8");
    }

    const url = `${ORIGIN}${urlPath}`;
    console.log("Prerendering:", url);

    // Create a fresh page instance for each render to avoid state leakage
    const page = await browser.newPage();

    try {
      await page.goto(url, { waitUntil: "networkidle0" });
      await page.waitForFunction('window.__PRERENDER_READY__ === true', { timeout: 10000 });

      const html = await page.content();
      prerenderedPaths.add(urlPath);

      // Determine the file path
      let filePath;
      if (urlPath === '/' || urlPath === '') {
        filePath = path.join(DIST_DIR, "index.html");
      } else {
        // Create directory structure for the path
        const dir = path.join(DIST_DIR, urlPath);
        await fs.mkdir(dir, { recursive: true });
        filePath = path.join(dir, "index.html");
      }

      await fs.writeFile(filePath, html, "utf8");
      console.log("✓ Prerendered:", urlPath || "/", "->", path.relative(DIST_DIR, filePath));

      // Extract internal links from this page
      const links = await page.evaluate(() => {
        const anchors = Array.from(document.querySelectorAll('a[href^="/"]'));
        return anchors
          .map(a => a.getAttribute('href'))
          .filter(href => href && !href.startsWith('//') && href !== '/');
      });

      return links;
    } catch (error) {
      console.error(`Error prerendering ${urlPath}:`, error.message);
      return null;
    } finally {
      // Close the page after each render
      await page.close();
    }
  }

  // First, render the home page to discover all links
  const homepageLinks = await prerenderPage('/');

  if (homepageLinks) {
    // Prerender all pages linked from the home page
    for (const link of homepageLinks) {
      await prerenderPage(link);
    }
    
    // Render the home page again at the end so it stays in dist/index.html
    prerenderedPaths.delete('/'); // Remove from set so we can render it again
    await prerenderPage('/');
  }

  console.log("\n✓ Prerendering complete!");
  console.log(`Total pages prerendered: ${prerenderedPaths.size}`);
  console.log("Paths:", Array.from(prerenderedPaths).join(", "));
  console.log("\nNote: The root index.html contains the prerendered home page.");
  console.log("Non-prerendered paths will naturally 404 and can use a custom 404 page for client-side rendering.");
} finally {
  await browser.close();
  server.close();
}
