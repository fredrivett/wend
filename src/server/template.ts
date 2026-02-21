export function getTemplate(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>syncdocs</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    :root {
      --sidebar-width: 280px;
      --bg: #ffffff;
      --bg-sidebar: #f8f9fa;
      --bg-hover: #e9ecef;
      --bg-active: #dde4eb;
      --border: #dee2e6;
      --text: #212529;
      --text-muted: #6c757d;
      --text-link: #0969da;
      --accent: #0969da;
      --code-bg: #f0f3f6;
      --graph-bg: #f8f9fa;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
      color: var(--text);
      background: var(--bg);
      line-height: 1.6;
    }

    #app {
      display: flex;
      height: 100vh;
    }

    /* Sidebar */
    #sidebar {
      width: var(--sidebar-width);
      min-width: var(--sidebar-width);
      background: var(--bg-sidebar);
      border-right: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    #sidebar-header {
      padding: 16px;
      border-bottom: 1px solid var(--border);
    }

    #sidebar-header h1 {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 8px;
    }

    #search {
      width: 100%;
      padding: 6px 10px;
      border: 1px solid var(--border);
      border-radius: 6px;
      font-size: 13px;
      outline: none;
      background: var(--bg);
    }

    #search:focus {
      border-color: var(--accent);
      box-shadow: 0 0 0 2px rgba(9, 105, 218, 0.15);
    }

    #symbol-tree {
      flex: 1;
      overflow-y: auto;
      padding: 8px 12px;
    }

    /* Tree controls */
    .tree-controls {
      display: flex;
      gap: 4px;
      margin-top: 8px;
    }

    .tree-controls button {
      flex: 1;
      padding: 4px 8px;
      font-size: 11px;
      font-weight: 500;
      color: var(--text-muted);
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 4px;
      cursor: pointer;
      font-family: inherit;
    }

    .tree-controls button:hover {
      background: var(--bg-hover);
      color: var(--text);
    }

    /* Tree nodes */
    .tree-dir {
      user-select: none;
    }

    .tree-dir-label {
      display: flex;
      align-items: center;
      height: 26px;
      font-size: 13px;
      font-weight: 500;
      color: var(--text);
      cursor: pointer;
    }

    .tree-dir-label:hover {
      background: var(--bg-hover);
    }

    .tree-dir-label .chevron {
      width: 16px;
      height: 16px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      color: var(--text-muted);
      flex-shrink: 0;
      transition: transform 0.15s ease;
    }

    .tree-dir.collapsed > .tree-dir-label .chevron {
      transform: rotate(-90deg);
    }

    .tree-dir-label .dir-name {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      margin-left: 2px;
    }

    .tree-children {
      /* No padding — indentation handled by guide elements */
    }

    .tree-dir.collapsed > .tree-children {
      display: none;
    }

    /* Guide elements — CSS-drawn tree lines, no gaps */
    .guide {
      width: 16px;
      flex-shrink: 0;
      position: relative;
      align-self: stretch;
    }

    /* Vertical line (ancestor has more siblings below) */
    .guide-line::before {
      content: '';
      position: absolute;
      left: 7px;
      top: 0;
      bottom: 0;
      border-left: 1px solid var(--border);
    }

    /* Tee connector ├ (not last child) */
    .guide-tee::before {
      content: '';
      position: absolute;
      left: 7px;
      top: 0;
      bottom: 0;
      border-left: 1px solid var(--border);
    }

    .guide-tee::after {
      content: '';
      position: absolute;
      left: 7px;
      top: 50%;
      right: 0;
      border-top: 1px solid var(--border);
    }

    /* Corner connector └ (last child) */
    .guide-corner::before {
      content: '';
      position: absolute;
      left: 7px;
      top: 0;
      height: 50%;
      border-left: 1px solid var(--border);
    }

    .guide-corner::after {
      content: '';
      position: absolute;
      left: 7px;
      top: 50%;
      right: 0;
      border-top: 1px solid var(--border);
    }

    /* Tree items (symbol links) */
    .tree-item {
      display: flex;
      align-items: center;
      height: 26px;
      font-size: 13px;
      color: var(--text);
      text-decoration: none;
      cursor: pointer;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .tree-item .item-name {
      margin-left: 2px;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    a.tree-item:hover {
      background: var(--bg-hover);
    }

    a.tree-item.active {
      background: var(--bg-active);
      font-weight: 500;
    }

    /* Main content */
    #main {
      flex: 1;
      overflow-y: auto;
      padding: 32px 48px;
      max-width: 900px;
    }

    #welcome {
      margin-top: 80px;
      text-align: center;
      color: var(--text-muted);
    }

    #welcome h2 {
      font-size: 20px;
      margin-bottom: 8px;
      color: var(--text);
    }

    /* Doc content */
    #doc-view h1 {
      font-size: 28px;
      font-weight: 600;
      margin-bottom: 4px;
    }

    .source-path {
      font-size: 13px;
      color: var(--text-muted);
      margin-bottom: 4px;
      font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace;
    }

    .doc-meta {
      font-size: 12px;
      color: var(--text-muted);
      margin-bottom: 16px;
      display: flex;
      gap: 16px;
    }

    .doc-meta span {
      white-space: nowrap;
    }

    .overview {
      font-size: 15px;
      line-height: 1.7;
      margin-bottom: 24px;
    }

    /* Dependency graph */
    .dep-graph {
      background: var(--graph-bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 24px;
    }

    .dep-graph h3 {
      font-size: 13px;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 12px;
    }

    .dep-graph .mermaid svg {
      max-width: 100%;
    }

    /* Style clickable mermaid nodes */
    .dep-graph .node.clickable rect,
    .dep-graph .node.clickable polygon {
      cursor: pointer;
    }

    /* Internal flow diagram */
    .internal-flow {
      margin-bottom: 24px;
    }

    .internal-flow summary {
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      padding: 8px 0;
      color: var(--text);
    }

    .internal-flow .mermaid {
      padding: 16px 0;
    }

    /* Markdown content */
    #doc-content h2 {
      font-size: 20px;
      margin-top: 24px;
      margin-bottom: 8px;
      padding-bottom: 4px;
      border-bottom: 1px solid var(--border);
    }

    #doc-content h3 {
      font-size: 16px;
      margin-top: 16px;
      margin-bottom: 8px;
    }

    #doc-content p {
      margin-bottom: 12px;
    }

    #doc-content ul, #doc-content ol {
      margin-bottom: 12px;
      padding-left: 24px;
    }

    #doc-content li {
      margin-bottom: 4px;
    }

    #doc-content code {
      font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace;
      font-size: 0.9em;
      background: var(--code-bg);
      padding: 2px 6px;
      border-radius: 4px;
    }

    #doc-content pre {
      background: var(--code-bg);
      border-radius: 8px;
      padding: 16px;
      overflow-x: auto;
      margin-bottom: 16px;
      font-size: 13px;
      line-height: 1.5;
    }

    #doc-content pre code {
      background: none;
      padding: 0;
    }

    #doc-content details {
      margin-bottom: 8px;
      border: 1px solid var(--border);
      border-radius: 8px;
      overflow: hidden;
    }

    #doc-content details summary {
      padding: 10px 16px;
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
      background: var(--bg-sidebar);
    }

    #doc-content details summary:hover {
      background: var(--bg-hover);
    }

    #doc-content details[open] summary {
      border-bottom: 1px solid var(--border);
    }

    #doc-content details > :not(summary) {
      padding: 0 16px;
    }

    #doc-content details > p:first-of-type,
    #doc-content details > h2:first-of-type,
    #doc-content details > h3:first-of-type,
    #doc-content details > ul:first-of-type,
    #doc-content details > ol:first-of-type,
    #doc-content details > pre:first-of-type {
      margin-top: 12px;
    }

    /* Related links */
    .related-link {
      color: var(--text-link);
      cursor: pointer;
      text-decoration: none;
    }

    .related-link:hover {
      text-decoration: underline;
    }

    /* Mermaid current node styling */
    .current > rect {
      fill: #dbeafe !important;
      stroke: #3b82f6 !important;
      stroke-width: 2px !important;
    }
  </style>
</head>
<body>
  <div id="app">
    <aside id="sidebar">
      <div id="sidebar-header">
        <h1>syncdocs</h1>
        <input type="text" id="search" placeholder="Search symbols...">
        <div class="tree-controls">
          <button id="collapse-all" title="Collapse all">Collapse all</button>
          <button id="expand-all" title="Expand all">Expand all</button>
        </div>
      </div>
      <nav id="symbol-tree"></nav>
    </aside>
    <main id="main">
      <div id="welcome">
        <h2>syncdocs viewer</h2>
        <p>Select a symbol from the sidebar to view its documentation.</p>
      </div>
      <div id="doc-view" style="display:none"></div>
    </main>
  </div>

  <script type="module">
    import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
    import { marked } from 'https://cdn.jsdelivr.net/npm/marked@15/lib/marked.esm.js';

    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
      flowchart: { useMaxWidth: true, htmlLabels: true },
    });

    // Configure marked to pass through HTML (details, summary, etc.)
    marked.setOptions({ breaks: false, gfm: true });

    let symbolIndex = {};
    let allSymbols = [];

    // --- Load index ---
    async function loadIndex() {
      const res = await fetch('/api/index');
      symbolIndex = await res.json();

      allSymbols = [];
      for (const [dir, symbols] of Object.entries(symbolIndex)) {
        for (const sym of symbols) {
          allSymbols.push({ ...sym, dir });
        }
      }

      renderSidebar(symbolIndex);
    }

    // --- Tree building ---
    function buildTree(index, filter = '') {
      const lowerFilter = filter.toLowerCase();
      const root = { children: {}, symbols: [] };

      for (const [dir, symbols] of Object.entries(index)) {
        const filtered = symbols.filter(s =>
          !filter || s.name.toLowerCase().includes(lowerFilter)
        );
        if (filtered.length === 0) continue;

        const parts = dir === '.' ? ['.'] : dir.split('/');
        let node = root;
        for (const part of parts) {
          if (!node.children[part]) {
            node.children[part] = { children: {}, symbols: [] };
          }
          node = node.children[part];
        }
        node.symbols.push(...filtered);
      }

      return root;
    }

    // Add guide elements to a row
    function addGuides(row, guides, isLast) {
      for (const hasLine of guides) {
        const g = document.createElement('span');
        g.className = hasLine ? 'guide guide-line' : 'guide';
        row.appendChild(g);
      }
      // Connector for current item
      const conn = document.createElement('span');
      conn.className = isLast ? 'guide guide-corner' : 'guide guide-tee';
      row.appendChild(conn);
    }

    function renderTreeNode(name, node, depth, guides, isLast) {
      const hasChildren = Object.keys(node.children).length > 0 || node.symbols.length > 0;
      if (!hasChildren) return null;

      const div = document.createElement('div');
      div.className = 'tree-dir';

      const label = document.createElement('div');
      label.className = 'tree-dir-label';

      // Add guide elements for depth > 0
      if (depth > 0) {
        addGuides(label, guides, isLast);
      }

      const chevron = document.createElement('span');
      chevron.className = 'chevron';
      chevron.innerHTML = '&#9660;';
      label.appendChild(chevron);

      const dirName = document.createElement('span');
      dirName.className = 'dir-name';
      dirName.textContent = name;
      label.appendChild(dirName);

      label.addEventListener('click', () => {
        div.classList.toggle('collapsed');
      });

      div.appendChild(label);

      const childContainer = document.createElement('div');
      childContainer.className = 'tree-children';

      // Build child guides: extend with current node's continuation info
      const childGuides = depth > 0 ? [...guides, !isLast] : [];

      // Collect all children (dirs first, then symbols)
      const sortedDirs = Object.keys(node.children).sort();
      const allItems = [];
      for (const d of sortedDirs) {
        allItems.push({ type: 'dir', name: d });
      }
      for (const sym of node.symbols) {
        allItems.push({ type: 'sym', sym });
      }

      for (let i = 0; i < allItems.length; i++) {
        const item = allItems[i];
        const itemIsLast = i === allItems.length - 1;

        if (item.type === 'dir') {
          const childEl = renderTreeNode(item.name, node.children[item.name], depth + 1, childGuides, itemIsLast);
          if (childEl) childContainer.appendChild(childEl);
        } else {
          const link = document.createElement('a');
          link.className = 'tree-item';
          link.dataset.docPath = item.sym.docPath;
          link.href = docPathToUrl(item.sym.docPath);

          addGuides(link, childGuides, itemIsLast);

          const nameSpan = document.createElement('span');
          nameSpan.className = 'item-name';
          nameSpan.textContent = item.sym.name;
          link.appendChild(nameSpan);

          childContainer.appendChild(link);
        }
      }

      div.appendChild(childContainer);
      return div;
    }

    // --- Sidebar ---
    function renderSidebar(index, filter = '') {
      const treeEl = document.getElementById('symbol-tree');
      treeEl.innerHTML = '';

      const tree = buildTree(index, filter);

      for (const [name, node] of Object.entries(tree.children).sort(([a],[b]) => a.localeCompare(b))) {
        const el = renderTreeNode(name, node, 0, [], false);
        if (el) treeEl.appendChild(el);
      }

      // Expand all when filtering
      if (filter) {
        treeEl.querySelectorAll('.tree-dir').forEach(d => d.classList.remove('collapsed'));
      }

      updateActiveLink();
    }

    // --- Collapse / Expand all ---
    document.getElementById('collapse-all').addEventListener('click', () => {
      document.querySelectorAll('#symbol-tree .tree-dir').forEach(d => d.classList.add('collapsed'));
    });

    document.getElementById('expand-all').addEventListener('click', () => {
      document.querySelectorAll('#symbol-tree .tree-dir').forEach(d => d.classList.remove('collapsed'));
    });

    // Convert docPath (e.g. "src/checker/index/StaleChecker.md") to URL path
    function docPathToUrl(docPath) {
      // Strip ".md" extension
      return '/docs/' + docPath.replace(/\\.md$/, '');
    }

    // Convert URL path back to docPath for API
    function urlToDocPath(pathname) {
      // Strip "/docs/" prefix, add ".md" extension
      const rest = pathname.replace(/^\\/docs\\/?/, '');
      if (!rest) return null;
      return rest + '.md';
    }

    function updateActiveLink() {
      const currentDocPath = urlToDocPath(window.location.pathname);
      document.querySelectorAll('.tree-item').forEach(el => {
        el.classList.toggle('active', el.dataset.docPath === currentDocPath);
      });
    }

    // --- Search ---
    document.getElementById('search').addEventListener('input', (e) => {
      renderSidebar(symbolIndex, e.target.value);
    });

    // --- Navigation ---
    async function navigate(docPath) {
      const res = await fetch('/api/doc?path=' + encodeURIComponent(docPath));
      if (!res.ok) return;

      const doc = await res.json();

      document.getElementById('welcome').style.display = 'none';
      const docView = document.getElementById('doc-view');
      docView.style.display = 'block';

      await renderDoc(doc, docView);
      updateActiveLink();

      // Scroll to top
      document.getElementById('main').scrollTop = 0;
    }

    async function renderDoc(doc, container) {
      let html = '';

      // Title
      html += '<h1>' + escapeHtml(doc.name) + '</h1>';

      // Source path
      if (doc.sourcePath) {
        html += '<div class="source-path">' + escapeHtml(doc.sourcePath) + '</div>';
      }

      // Metadata (syncdocs version, generated timestamp)
      const metaParts = [];
      metaParts.push('<span>syncdocs v' + (doc.syncdocsVersion ? escapeHtml(doc.syncdocsVersion) : ': unknown') + '</span>');
      if (doc.generated) {
        const date = new Date(doc.generated);
        const formatted = date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
          + ' ' + date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
        metaParts.push('<span>Generated ' + formatted + '</span>');
      }
      if (metaParts.length > 0) {
        html += '<div class="doc-meta">' + metaParts.join('') + '</div>';
      }

      // Dependency graph
      if (doc.dependencyGraph) {
        html += '<div class="dep-graph">';
        html += '<h3>Dependencies</h3>';
        html += '<div class="mermaid" id="dep-graph-mermaid">' + escapeHtml(doc.dependencyGraph) + '</div>';
        html += '</div>';
      }

      // Parse the markdown
      // Extract the first mermaid block (Visual Flow) separately
      const mdContent = doc.markdown;

      // Split around the Visual Flow details section
      const visualFlowMatch = mdContent.match(
        /(<details>\\s*<summary>Visual Flow<\\/summary>[\\s\\S]*?<\\/details>)/
      );

      let beforeVisualFlow = mdContent;
      let visualFlowHtml = '';
      let afterVisualFlow = '';

      const vfIdx = mdContent.indexOf('<details>');
      const vfDetails = mdContent.match(/<details>\\s*<summary>Visual Flow<\\/summary>[\\s\\S]*?<\\/details>/);

      // Render the full markdown content
      const rendered = marked.parse(mdContent);

      html += '<div id="doc-content">' + rendered + '</div>';

      container.innerHTML = html;

      // Render mermaid diagrams
      try {
        const mermaidEls = container.querySelectorAll('.mermaid, pre code.language-mermaid');

        // Handle code blocks with mermaid language
        container.querySelectorAll('pre code.language-mermaid').forEach(codeEl => {
          const pre = codeEl.parentElement;
          const div = document.createElement('div');
          div.className = 'mermaid';
          div.textContent = codeEl.textContent;
          pre.replaceWith(div);
        });

        // Now render all mermaid elements
        const allMermaid = container.querySelectorAll('.mermaid');
        for (let i = 0; i < allMermaid.length; i++) {
          const el = allMermaid[i];
          const id = 'mermaid-' + Date.now() + '-' + i;
          try {
            const { svg } = await mermaid.render(id, el.textContent.trim());
            el.innerHTML = svg;
          } catch (e) {
            console.warn('Mermaid render error:', e);
          }
        }
      } catch (e) {
        console.warn('Mermaid init error:', e);
      }

      // Auto-expand the Visual Flow details section
      container.querySelectorAll('#doc-content details > summary').forEach(summary => {
        if (summary.textContent.trim() === 'Visual Flow') {
          summary.parentElement.setAttribute('open', '');
        }
      });

      // Make related symbol names clickable
      if (doc.related && doc.related.length > 0) {
        const relatedMap = new Map(doc.related.map(r => [r.name, r.docPath]));

        // Find code elements with symbol names and make them clickable
        container.querySelectorAll('#doc-content code').forEach(codeEl => {
          const text = codeEl.textContent.replace(/\\(\\)$/, '');
          if (relatedMap.has(text)) {
            const link = document.createElement('a');
            link.className = 'related-link';
            link.href = docPathToUrl(relatedMap.get(text));
            link.textContent = codeEl.textContent;
            codeEl.replaceWith(link);
          }
        });
      }
    }

    function escapeHtml(str) {
      return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    // --- Routing ---
    function handleRoute() {
      const docPath = urlToDocPath(window.location.pathname);
      if (docPath) {
        navigate(docPath);
      }
    }

    // Intercept clicks on internal doc links
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href^="/docs/"]');
      if (!link) return;
      e.preventDefault();
      history.pushState(null, '', link.href);
      handleRoute();
    });

    window.addEventListener('popstate', handleRoute);

    // --- Init ---
    await loadIndex();
    handleRoute();
  </script>
</body>
</html>`;
}
