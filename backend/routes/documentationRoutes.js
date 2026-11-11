const express = require('express');
const { createOpenApiDocument } = require('../docs/openApiSpec');

const router = express.Router();

const renderDocsHtml = () => `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>School Management API Docs</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f6f7f9;
      --panel: #ffffff;
      --border: #d9dee8;
      --text: #172033;
      --muted: #687386;
      --accent: #0f766e;
      --accent-soft: #dff5f1;
      --danger: #b42318;
      --code: #111827;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: var(--bg);
      color: var(--text);
    }
    header {
      position: sticky;
      top: 0;
      z-index: 2;
      border-bottom: 1px solid var(--border);
      background: rgba(255, 255, 255, 0.96);
      backdrop-filter: blur(12px);
    }
    .topbar {
      max-width: 1180px;
      margin: 0 auto;
      padding: 18px 20px;
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 16px;
      align-items: center;
    }
    h1 {
      margin: 0;
      font-size: 22px;
      font-weight: 750;
      letter-spacing: 0;
    }
    .subtitle {
      margin: 4px 0 0;
      color: var(--muted);
      font-size: 14px;
    }
    .links {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      justify-content: flex-end;
    }
    .links a {
      color: var(--accent);
      text-decoration: none;
      border: 1px solid var(--border);
      background: var(--panel);
      padding: 8px 10px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 650;
    }
    main {
      max-width: 1180px;
      margin: 0 auto;
      padding: 22px 20px 44px;
      display: grid;
      grid-template-columns: 280px minmax(0, 1fr);
      gap: 20px;
    }
    aside {
      position: sticky;
      top: 88px;
      align-self: start;
      border: 1px solid var(--border);
      background: var(--panel);
      border-radius: 8px;
      padding: 14px;
      max-height: calc(100vh - 112px);
      overflow: auto;
    }
    input {
      width: 100%;
      height: 38px;
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 0 10px;
      font: inherit;
      color: var(--text);
      background: #fff;
    }
    .nav {
      margin-top: 14px;
      display: grid;
      gap: 6px;
    }
    .nav a {
      display: block;
      padding: 8px 9px;
      color: var(--text);
      text-decoration: none;
      border-radius: 6px;
      font-size: 14px;
    }
    .nav a:hover { background: var(--accent-soft); color: var(--accent); }
    .stats {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
      margin-bottom: 18px;
    }
    .stat, section {
      border: 1px solid var(--border);
      background: var(--panel);
      border-radius: 8px;
    }
    .stat {
      padding: 14px;
    }
    .stat strong {
      display: block;
      font-size: 22px;
    }
    .stat span {
      display: block;
      margin-top: 4px;
      color: var(--muted);
      font-size: 13px;
    }
    section {
      margin-bottom: 16px;
      overflow: hidden;
    }
    .module-head {
      padding: 15px 16px;
      border-bottom: 1px solid var(--border);
      display: grid;
      gap: 5px;
    }
    .module-head h2 {
      margin: 0;
      font-size: 18px;
      letter-spacing: 0;
    }
    .module-head p {
      margin: 0;
      color: var(--muted);
      font-size: 14px;
      line-height: 1.45;
    }
    .endpoint {
      display: grid;
      grid-template-columns: 82px minmax(0, 1fr);
      gap: 12px;
      padding: 12px 16px;
      border-top: 1px solid #edf0f5;
      align-items: start;
    }
    .endpoint:first-of-type { border-top: 0; }
    .method {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 28px;
      border-radius: 5px;
      color: #fff;
      font-size: 12px;
      font-weight: 800;
    }
    .get { background: #2563eb; }
    .post { background: #0f766e; }
    .put, .patch { background: #b45309; }
    .delete { background: #b42318; }
    code {
      color: var(--code);
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
      font-size: 13px;
      overflow-wrap: anywhere;
    }
    .meta {
      margin-top: 6px;
      color: var(--muted);
      font-size: 13px;
      line-height: 1.45;
    }
    .auth {
      color: var(--danger);
      font-weight: 650;
    }
    .empty {
      border: 1px solid var(--border);
      background: var(--panel);
      border-radius: 8px;
      padding: 22px;
      color: var(--muted);
    }
    @media (max-width: 860px) {
      .topbar, main {
        grid-template-columns: 1fr;
      }
      .links {
        justify-content: flex-start;
      }
      aside {
        position: relative;
        top: auto;
        max-height: none;
      }
      .stats {
        grid-template-columns: 1fr;
      }
      .endpoint {
        grid-template-columns: 1fr;
      }
      .method {
        width: 82px;
      }
    }
  </style>
</head>
<body>
  <header>
    <div class="topbar">
      <div>
        <h1>School Management API Docs</h1>
        <p class="subtitle">OpenAPI 3.0 documentation generated from the backend route modules.</p>
      </div>
      <div class="links">
        <a href="/api/docs/openapi.json">OpenAPI JSON</a>
        <a href="https://editor.swagger.io/" rel="noreferrer">Swagger Editor</a>
      </div>
    </div>
  </header>
  <main>
    <aside>
      <input id="search" type="search" placeholder="Search modules or endpoints" autocomplete="off" />
      <nav id="nav" class="nav"></nav>
    </aside>
    <div>
      <div id="stats" class="stats"></div>
      <div id="content" class="empty">Loading API documentation...</div>
    </div>
  </main>
  <script>
    const state = { spec: null, query: '' };
    const byId = (id) => document.getElementById(id);
    const esc = (value) => String(value || '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    }[char]));

    const getOperations = (spec) => {
      const operations = [];
      Object.entries(spec.paths || {}).forEach(([path, methods]) => {
        Object.entries(methods || {}).forEach(([method, operation]) => {
          operations.push({ path, method, operation, tag: (operation.tags && operation.tags[0]) || 'Other' });
        });
      });
      return operations;
    };

    const render = () => {
      const spec = state.spec;
      const allOperations = getOperations(spec);
      const query = state.query.toLowerCase();
      const modules = spec.tags || [];
      const matchingOperations = allOperations.filter((item) => {
        const haystack = [item.path, item.method, item.tag, item.operation.summary, item.operation.description].join(' ').toLowerCase();
        return !query || haystack.includes(query);
      });
      const grouped = matchingOperations.reduce((acc, item) => {
        if (!acc[item.tag]) acc[item.tag] = [];
        acc[item.tag].push(item);
        return acc;
      }, {});

      byId('stats').innerHTML = [
        ['Modules', modules.length],
        ['Endpoints', allOperations.length],
        ['Documented', matchingOperations.length],
      ].map(([label, value]) => '<div class="stat"><strong>' + value + '</strong><span>' + label + '</span></div>').join('');

      byId('nav').innerHTML = modules
        .filter((moduleInfo) => grouped[moduleInfo.name])
        .map((moduleInfo) => '<a href="#' + esc(moduleInfo.name.replace(/\\s+/g, '-')) + '">' + esc(moduleInfo.name) + '</a>')
        .join('');

      if (!matchingOperations.length) {
        byId('content').className = 'empty';
        byId('content').textContent = 'No endpoints match your search.';
        return;
      }

      byId('content').className = '';
      byId('content').innerHTML = modules
        .filter((moduleInfo) => grouped[moduleInfo.name])
        .map((moduleInfo) => {
          const endpoints = grouped[moduleInfo.name]
            .sort((a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method))
            .map((item) => {
              const roles = (item.operation['x-roles'] || []).join(', ');
              const auth = item.operation.security ? '<span class="auth">Bearer JWT</span>' : 'Public';
              return '<div class="endpoint">' +
                '<span class="method ' + esc(item.method) + '">' + esc(item.method.toUpperCase()) + '</span>' +
                '<div><code>' + esc(item.path) + '</code>' +
                '<div class="meta">' + esc(item.operation.summary || '') + '</div>' +
                '<div class="meta">Auth: ' + auth + (roles ? ' | Roles: ' + esc(roles) : '') + '</div>' +
                '</div></div>';
            }).join('');

          return '<section id="' + esc(moduleInfo.name.replace(/\\s+/g, '-')) + '">' +
            '<div class="module-head"><h2>' + esc(moduleInfo.name) + '</h2><p>' + esc(moduleInfo.description || '') + '</p></div>' +
            endpoints +
            '</section>';
        }).join('');
    };

    fetch('/api/docs/openapi.json')
      .then((response) => response.json())
      .then((spec) => {
        state.spec = spec;
        render();
      })
      .catch((error) => {
        byId('content').className = 'empty';
        byId('content').textContent = 'Unable to load API documentation: ' + error.message;
      });

    byId('search').addEventListener('input', (event) => {
      state.query = event.target.value;
      if (state.spec) render();
    });
  </script>
</body>
</html>`;

router.get('/', (req, res) => {
  res.type('html').send(renderDocsHtml());
});

router.get('/openapi.json', (req, res) => {
  res.json(createOpenApiDocument(req));
});

module.exports = router;
