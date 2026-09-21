import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const jsonPath = path.join(root, "production-wiring-inventory.json");
const csvPath = path.join(root, "production-wiring-inventory.csv");
const reportPath = path.join(root, "PRODUCTION_WIRING_AUDIT_REPORT.md");

if (!fs.existsSync(jsonPath) || !fs.existsSync(csvPath)) {
  throw new Error("Generate production wiring inventory before generating the report.");
}

const inventory = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
const csvText = fs.readFileSync(csvPath, "utf8");

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((item) => item.length > 1);
}

function esc(value) {
  return String(value ?? "").replaceAll("|", "\\|").replaceAll("\n", " ");
}

function table(headers, rows) {
  return [
    `| ${headers.map(esc).join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map(esc).join(" | ")} |`),
  ].join("\n");
}

const records = Array.isArray(inventory.records) ? inventory.records : [];
const csvRows = parseCsv(csvText);
const csvDataRows = Math.max(0, csvRows.length - 1);
const statusCounts = records.reduce((acc, record) => {
  const key = record.status || "UNKNOWN";
  acc[key] = (acc[key] || 0) + 1;
  return acc;
}, {});

const red = records.filter((record) => record.status === "RED");
const yellow = records.filter((record) => record.status === "YELLOW");
const green = records.filter((record) => record.status === "GREEN");

const issueRows = [...red, ...yellow].map((record) => [
  record.status,
  record.record_type,
  record.method || "",
  record.api_endpoint || record.route || record.screen || "",
  record.evidence || "",
  record.notes || "",
]);

const reconciliationOk =
  csvDataRows === records.length &&
  Number(inventory.reconciliation?.records_missing_evidence || 0) === 0;

const verdict =
  red.length === 0 && yellow.length === 0
    ? "**STATIC WIRING AUDIT: GREEN — 0 RED and 0 YELLOW records.**"
    : `**STATIC WIRING AUDIT: ATTENTION — ${red.length} RED and ${yellow.length} YELLOW records remain.**`;

const report = `# HIREGO AI — PRODUCTION WIRING AUDIT

Generated: ${inventory.generated_at}
Repository: ${inventory.repository}
Scanner: ${inventory.scanner}

## Executive result

${verdict}

This report is generated directly from the current source inventory. It intentionally does not make stale manual claims about providers, storage, authentication, or deployment state. Runtime readiness is verified separately by CI, deployment checks, provider E2E tests, and operations evidence.

## Inventory summary

${table(
  ["Metric", "Count"],
  [
    ["Inventory records", records.length],
    ["GREEN", green.length],
    ["YELLOW", yellow.length],
    ["RED", red.length],
    ["Screens", inventory.source_counts?.screens ?? 0],
    ["API route files", inventory.source_counts?.api_route_files ?? 0],
    ["API endpoint records", inventory.reconciliation?.api_endpoint_records ?? 0],
    ["User action records", inventory.reconciliation?.user_action_records ?? 0],
    ["Frontend API call records", inventory.reconciliation?.frontend_api_call_records ?? 0],
    ["Server action records", inventory.reconciliation?.server_action_records ?? 0],
  ],
)}

## Reconciliation

${table(
  ["Check", "Result", "Evidence"],
  [
    ["JSON / CSV record count", csvDataRows === records.length ? "PASS" : "FAIL", `${records.length} JSON records / ${csvDataRows} CSV data rows`],
    ["Records missing evidence", Number(inventory.reconciliation?.records_missing_evidence || 0) === 0 ? "PASS" : "FAIL", String(inventory.reconciliation?.records_missing_evidence || 0)],
    ["Overall reconciliation", reconciliationOk ? "PASS" : "FAIL", reconciliationOk ? "Generated artifacts agree" : "Generated artifacts require investigation"],
  ],
)}

## Remaining RED / YELLOW records

${issueRows.length
  ? table(["Status", "Type", "Method", "Route / endpoint", "Evidence", "Notes"], issueRows)
  : "None. The current generated wiring inventory contains no RED or YELLOW records."}

## Scope and limitations

This is a static source-wiring audit. A GREEN wiring record means the scanner found a production-shaped implementation path and did not detect the configured mock/prototype patterns. It is not, by itself, proof of live provider credentials, real payment settlement, TURN traversal, email/WhatsApp delivery, restore success, rollback success, or production load capacity.

Those runtime and operational checks must remain separate release gates.

## Generated artifacts

- `production-wiring-inventory.json`
- `production-wiring-inventory.csv`
- `PRODUCTION_WIRING_AUDIT_REPORT.md`

The CI pipeline regenerates these files and fails when committed artifacts drift from current source, preventing this report from becoming silently stale.
`;

fs.writeFileSync(reportPath, report, "utf8");
console.log(JSON.stringify({
  report: path.relative(root, reportPath).replaceAll(path.sep, "/"),
  records: records.length,
  statusCounts,
  red_records: red.length,
  yellow_records: yellow.length,
  reconciliation_ok: reconciliationOk,
}, null, 2));
