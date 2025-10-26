import puppeteer from "puppeteer";

const PORT = 3000;
const ORIGIN = `http://127.0.0.1:${PORT}`;

const browser = await puppeteer.launch({ headless: true });

try {
  const testCases = [
    { path: '/', expectedPath: '/', shouldPrerender: true, description: 'Home page (prerendered)' },
    { path: '/projects/thavalon', expectedPath: '/projects/thavalon', shouldPrerender: true, description: 'Thavalon project (prerendered)' },
    { path: '/non-existent-page', expectedPath: null, shouldPrerender: false, description: 'Non-existent page (should client-render)' },
    { path: '/projects/non-existent-project', expectedPath: null, shouldPrerender: false, description: 'Non-existent project (should client-render)' },
  ];

  console.log('Testing prerender path matching...\n');

  for (const testCase of testCases) {
    const page = await browser.newPage();
    
    // Capture console logs
    const logs = [];
    page.on('console', msg => logs.push(msg.text()));

    try {
      await page.goto(`${ORIGIN}${testCase.path}`, { waitUntil: "networkidle0", timeout: 5000 });
      
      const prerenderedPath = await page.evaluate(() => 
        document.documentElement.getAttribute('data-prerendered-path')
      );
      
      const title = await page.title();
      
      console.log(`✓ ${testCase.description}`);
      console.log(`  Path: ${testCase.path}`);
      console.log(`  data-prerendered-path: ${prerenderedPath || '(none)'}`);
      console.log(`  Title: ${title}`);
      
      // Check for client-side rendering log
      const hasClientRenderLog = logs.some(log => 
        log.includes('re-rendering') || log.includes('client-side rendering')
      );
      
      if (testCase.shouldPrerender) {
        if (prerenderedPath === testCase.expectedPath) {
          console.log(`  ✓ Correctly using prerendered content`);
        } else {
          console.log(`  ✗ Expected prerendered path '${testCase.expectedPath}', got '${prerenderedPath}'`);
        }
      } else {
        if (hasClientRenderLog || prerenderedPath !== testCase.path) {
          console.log(`  ✓ Correctly triggering client-side rendering`);
        } else {
          console.log(`  ✗ Should have triggered client-side rendering`);
        }
      }
      
      console.log('');
    } catch (error) {
      console.log(`  ✗ Error: ${error.message}`);
      console.log('');
    } finally {
      await page.close();
    }
  }
} finally {
  await browser.close();
  console.log('Tests complete!');
  process.exit(0);
}

