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
      padding: 8px 0;
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
      gap: 4px;
      padding: 3px 8px;
      font-size: 13px;
      font-weight: 500;
      color: var(--text);
      cursor: pointer;
      border-radius: 4px;
      margin: 0 4px;
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

    .tree-dir-label .dir-icon {
      font-size: 12px;
      flex-shrink: 0;
    }

    .tree-dir-label .dir-name {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .tree-children {
      overflow: hidden;
    }

    .tree-dir.collapsed > .tree-children {
      display: none;
    }

    .symbol-link {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 3px 8px;
      font-size: 13px;
      color: var(--text);
      text-decoration: none;
      cursor: pointer;
      border-left: 2px solid transparent;
      border-radius: 0 4px 4px 0;
      margin: 0 4px 0 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .symbol-link .sym-icon {
      color: var(--text-muted);
      font-size: 12px;
      flex-shrink: 0;
      width: 16px;
      text-align: center;
    }

    .symbol-link:hover {
      background: var(--bg-hover);
    }

    .symbol-link.active {
      background: var(--bg-active);
      border-left-color: var(--accent);
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
      margin-bottom: 16px;
      font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace;
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

    function renderTreeNode(name, node, depth) {
      const hasChildren = Object.keys(node.children).length > 0 || node.symbols.length > 0;
      if (!hasChildren) return null;

      const div = document.createElement('div');
      div.className = 'tree-dir';

      const label = document.createElement('div');
      label.className = 'tree-dir-label';
      label.style.paddingLeft = (8 + depth * 16) + 'px';

      label.innerHTML =
        '<span class="chevron">&#9660;</span>' +
        '<span class="dir-name">' + escapeHtml(name) + '</span>';

      label.addEventListener('click', () => {
        div.classList.toggle('collapsed');
      });

      div.appendChild(label);

      const childContainer = document.createElement('div');
      childContainer.className = 'tree-children';

      // Render subdirectories first
      const sortedDirs = Object.keys(node.children).sort();
      for (const childName of sortedDirs) {
        const childEl = renderTreeNode(childName, node.children[childName], depth + 1);
        if (childEl) childContainer.appendChild(childEl);
      }

      // Then symbols
      for (const sym of node.symbols) {
        const link = document.createElement('a');
        link.className = 'symbol-link';
        link.style.paddingLeft = (8 + (depth + 1) * 16) + 'px';
        link.innerHTML = '<span class="sym-icon">&#9643;</span> ' + escapeHtml(sym.name);
        link.dataset.docPath = sym.docPath;
        link.href = '#/doc/' + encodeURIComponent(sym.docPath);
        childContainer.appendChild(link);
      }

      div.appendChild(childContainer);
      return div;
    }

    // --- Sidebar ---
    function renderSidebar(index, filter = '') {
      const treeEl = document.getElementById('symbol-tree');
      treeEl.innerHTML = '';

      const tree = buildTree(index, filter);

      // If filtering, render flat so nothing is hidden
      if (filter) {
        for (const [name, node] of Object.entries(tree.children).sort(([a],[b]) => a.localeCompare(b))) {
          const el = renderTreeNode(name, node, 0);
          if (el) treeEl.appendChild(el);
        }
        // Expand all when filtering
        treeEl.querySelectorAll('.tree-dir').forEach(d => d.classList.remove('collapsed'));
      } else {
        for (const [name, node] of Object.entries(tree.children).sort(([a],[b]) => a.localeCompare(b))) {
          const el = renderTreeNode(name, node, 0);
          if (el) treeEl.appendChild(el);
        }
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

    function updateActiveLink() {
      const hash = decodeURIComponent(window.location.hash.slice(6) || '');
      document.querySelectorAll('.symbol-link').forEach(el => {
        el.classList.toggle('active', el.dataset.docPath === hash);
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

      // Make related symbol names clickable
      if (doc.related && doc.related.length > 0) {
        const relatedMap = new Map(doc.related.map(r => [r.name, r.docPath]));

        // Find code elements with symbol names and make them clickable
        container.querySelectorAll('#doc-content code').forEach(codeEl => {
          const text = codeEl.textContent.replace(/\\(\\)$/, '');
          if (relatedMap.has(text)) {
            const link = document.createElement('a');
            link.className = 'related-link';
            link.href = '#/doc/' + encodeURIComponent(relatedMap.get(text));
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
    function handleHash() {
      const hash = window.location.hash;
      if (hash.startsWith('#/doc/')) {
        const docPath = decodeURIComponent(hash.slice(6));
        navigate(docPath);
      }
    }

    window.addEventListener('hashchange', handleHash);

    // --- Init ---
    await loadIndex();
    if (window.location.hash) {
      handleHash();
    }
  </script>
</body>
</html>`;
}
