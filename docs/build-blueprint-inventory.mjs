// Documentation-only static inventory. No imports of application code or .env.
import fs from 'node:fs';
import path from 'node:path';
const root = process.cwd();
const walk = dir => fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
  const full = path.join(dir, e.name);
  return e.isDirectory() ? (['node_modules', '__pycache__'].includes(e.name) ? [] : walk(full)) : [full];
}) : [];
const relative = f => path.relative(root, f).replaceAll('\\', '/');
const files = [...walk(path.join(root, 'src')), ...walk(path.join(root, 'video-analysis-worker'))]
  .filter(f => /\.(tsx?|jsx?|py)$/.test(f)).sort();
const line = (s, n) => s.slice(0, n).split('\n').length;
const records = files.map(file => {
  const text = fs.readFileSync(file, 'utf8'), name = relative(file);
  const type = /\/page\.[tj]sx?$/.test(name) ? 'page' : /\/route\.[tj]s$/.test(name) ? 'api' : /(?:\/tests\/|\.test\.)/.test(name) ? 'test' : 'module';
  const route = ['page', 'api'].includes(type) ? '/' + name.replace(/^src\/app\//, '').replace(/(?:^|\/)(page|route)\.[tj]sx?$/, '').split('/').filter(s => s && !/^\(.*\)$/.test(s)).join('/') : null;
  return { file: name, type, route, lines: text.split('\n').length,
    imports: [...text.matchAll(/(?:from\s*|import\s*)['"]([^'"]+)['"]/g)].map(m => ({ name: m[1], line: line(text, m.index) })),
    methods: [...text.matchAll(/export\s+(?:async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)\b/g)].map(m => ({ method: m[1], line: line(text, m.index) })),
    apiReferences: [...text.matchAll(/['"`]((?:\/api\/)[^'"`\s]*)/g)].map(m => ({ value: m[1], line: line(text, m.index) })),
    prismaDelegates: [...new Set([...text.matchAll(/(?:prisma|tx)\.([a-zA-Z]+)\./g)].map(m => m[1]))],
    auditStatus: 'STATIC_INVENTORY_ONLY_NOT_RUNTIME_VERIFIED',
  };
});
const schema = fs.readFileSync(path.join(root, 'prisma/schema.prisma'), 'utf8');
const models = [...schema.matchAll(/^(model|enum)\s+(\w+)\s*\{/gm)].map(m => ({ type: m[1], name: m[2], line: line(schema, m.index) }));
const summary = { generatedAt: new Date().toISOString(), sourceFiles: records.length, pages: records.filter(r => r.type === 'page').length,
  apiRoutes: records.filter(r => r.type === 'api').length, apiMethods: records.reduce((n, r) => n + r.methods.length, 0),
  testFiles: records.filter(r => r.type === 'test').length, models: models.filter(m => m.type === 'model').length,
  caveat: 'Regex source inventory, not exhaustive data-flow analysis, security certification or a working-feature count.' };
fs.writeFileSync(path.join(root, 'docs/BLUEPRINT_SOURCE_INVENTORY.json'), JSON.stringify({ summary, records, models }, null, 2));
const link = (file, n = 1) => `[${file}:${n}](<${path.join(root, file).replaceAll('\\', '/')}:${n}>)`;
const output = ['# HireGo complete source inventory', '', 'Generated from the current checkout. Every row is inventoried, NOT automatically functionally verified. See CTO_BLUEPRINT.md for reviewed business traces and gaps.', '',
  '```json', JSON.stringify(summary, null, 2), '```', '', '## Every page', '', '| Route | Source | Direct API references (may use additional shared modules) |', '| --- | --- | --- |',
  ...records.filter(r => r.type === 'page').map(r => `| ${r.route} | ${link(r.file)} | ${[...new Set(r.apiReferences.map(a => a.value))].join(', ').replaceAll('|', '\\|') || 'None detected in this file; inspect imports'} |`),
  '', '## Every API route', '', '| Route | Methods | Source | Direct Prisma delegates |', '| --- | --- | --- | --- |',
  ...records.filter(r => r.type === 'api').map(r => `| ${r.route} | ${r.methods.map(m => m.method).join(', ')} | ${link(r.file)} | ${r.prismaDelegates.join(', ')} |`),
  '', '## Every model / enum', '', '| Kind | Name | Source |', '| --- | --- | --- |',
  ...models.map(m => `| ${m.type} | ${m.name} | ${link('prisma/schema.prisma', m.line)} |`),
  '', '## Remaining source and test files', '', '| Classification | File | Lines |', '| --- | --- | --- |',
  ...records.filter(r => !['page', 'api'].includes(r.type)).map(r => `| ${r.type} | ${link(r.file)} | ${r.lines} |`),
  '', 'Full import/API reference metadata and line evidence are in BLUEPRINT_SOURCE_INVENTORY.json. Dynamic URLs, re-exports, runtime registration and computed dependencies require human tracing. Environment files and secrets were not inventoried.', ''];
fs.writeFileSync(path.join(root, 'docs/BLUEPRINT_SOURCE_INVENTORY.md'), output.join('\n'));
console.log(JSON.stringify(summary));
