import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const outputJson = path.join(root, "production-wiring-inventory.json");
const outputCsv = path.join(root, "production-wiring-inventory.csv");
const sourceRoots = ["src/app", "src/components", "src/services", "src/lib", "src/utils", "src/hooks", "src/context", "src/store"];
const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx"]);

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return sourceExtensions.has(path.extname(entry.name)) ? [full] : [];
  });
}

function relative(file) {
  return path.relative(root, file).replaceAll(path.sep, "/");
}

function lineAt(text, index) {
  return text.slice(0, index).split(/\r?\n/).length;
}

function routeFromFile(file, kind) {
  let route = relative(file).replace(/^src\/app\//, "");
  route = route.replace(new RegExp(`/${kind}\\.(tsx|ts|jsx|js)$`), "");
  route = route.replace(/\.(tsx|ts|jsx|js)$/, "");
  route = route.replace(/\/\([^/]+\)/g, "");
  route = route.replace(/\[\.\.\.([^/]+)\]/g, ":$1*").replace(/\[([^/]+)\]/g, ":$1");
  return `/${route}`.replace(/\/+/g, "/").replace(/\/$/, "") || "/";
}

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

function csvValue(value) {
  if (value === null || value === undefined) return "";
  const text = Array.isArray(value) ? value.join(" | ") : typeof value === "object" ? JSON.stringify(value) : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function fileLineEvidence(file, line, note) {
  return `${relative(file)}:${line}${note ? ` — ${note}` : ""}`;
}

function allMatches(text, regex) {
  const result = [];
  for (const match of text.matchAll(regex)) result.push(match);
  return result;
}

function detectProvider(text) {
  const providers = [];
  if (/openai/i.test(text)) providers.push("OpenAI");
  if (/anthropic|claude/i.test(text)) providers.push("Anthropic");
  if (/gemini|google/i.test(text)) providers.push("Google Gemini");
  if (/deepseek/i.test(text)) providers.push("DeepSeek");
  if (/kimi|moonshot/i.test(text)) providers.push("Kimi/Moonshot");
  if (/whatsapp/i.test(text)) providers.push("WhatsApp Cloud API");
  if (/razorpay/i.test(text)) providers.push("Razorpay");
  if (/phonepe/i.test(text)) providers.push("PhonePe");
  if (/stripe/i.test(text)) providers.push("Stripe");
  if (/sendgrid|smtp/i.test(text)) providers.push("SMTP/SendGrid");
  if (/webrtc|mediasoup/i.test(text)) providers.push("WebRTC");
  if (/supabase/i.test(text)) providers.push("Supabase");
  if (/googleusercontent\.com|commondatastorage\.googleapis\.com/i.test(text)) providers.push("External asset host");
  return unique(providers);
}

function detectRos(text) {
  const names = [
    "RosGateway", "TenantContext", "RbacGuard", "KillSwitchManager", "BudgetManager", "ToolRegistry",
    "AgentLifecycle", "Outbox", "EventDispatcher", "ConsumerRegistry", "IdempotencyGuard", "WorkflowEngine",
    "DlqManager", "CircuitBreaker", "ModelRouter", "FairnessAuditor", "AgentEvaluator", "ShadowExecutor",
    "MemoryManager", "AgentRegistry", "OperationalAgents", "CeoDelegationGuard", "ExecutionLoop",
    "HiringPipeline", "TraceRecorder", "FailureRecoveryRunner",
  ];
  return names.filter((name) => text.includes(name));
}

function detectAgents(text) {
  const names = [
    "ResumeEvaluatorAgent", "MockInterviewCopilotAgent", "SecurityJudgeAgent", "CommunicationCoachAgent",
    "JdGeneratorAgent", "CandidateMatchmakerAgent",
  ];
  return names.filter((name) => text.includes(name));
}

function detectDbModels(text) {
  return unique([
    ...allMatches(text, /prisma\.([A-Za-z0-9_]+)/g).map((m) => `prisma.${m[1]}`),
    ...allMatches(text, /(?:db|database)\.([A-Za-z0-9_]+)/g).map((m) => `${m[0].split(".")[0]}.${m[1]}`),
  ]);
}

function detectServices(text) {
  return unique([
    ...allMatches(text, /from\s+["']@\/(lib|services)\/([^"']+)["']/g).map((m) => `@/${m[1]}/${m[2]}`),
    ...allMatches(text, /from\s+["']\.\.\/([^"']+)["']/g).map((m) => `relative:${m[1]}`),
  ]);
}

function hasMock(text) {
  return /\b(mockData|mockUser|dummyData|fakeData|demoData|sampleData|simulatedData|hardcodedData|staticData|rawHtml)\b|\b(simulated|fabricated)\s+(response|result|record|profile|job|notification)/i.test(text);
}

function hasErrorHandling(text) {
  return /try\s*\{|catch\s*\(|handleApiError|jsonError|error boundary|setError/i.test(text);
}

function hasAuth(text) {
  return /getCurrentSession|verifySessionToken|AUTH_COOKIE_NAME|hirego_session|session\b|requireAuth|useAuth/i.test(text);
}

function hasRbac(text) {
  return /RbacGuard|hasRoleAccess|role\s*!==|role\s*===|allowedRoles|ADMIN|EMPLOYER|RECRUITER|CANDIDATE/i.test(text);
}

function hasTenant(text) {
  return /tenant|companyId|employerProfile|company\.id|validateTenantAccess|assertOwnership|scopeId/i.test(text);
}

function hasIdempotency(text) {
  return /idempotency|dedup|unique|replay|duplicate/i.test(text);
}

function classify(text, kind, hasAction = false) {
  if (hasMock(text)) return { status: "RED", severity: "HIGH" };
  if (kind === "screen" && !hasAction) return { status: "GREEN", severity: "LOW" };
  if (kind === "endpoint") {
    const wired = detectDbModels(text).length > 0 || detectServices(text).length > 0 || detectProvider(text).length > 0;
    return wired && hasErrorHandling(text)
      ? { status: "GREEN", severity: "LOW" }
      : { status: "YELLOW", severity: "MEDIUM" };
  }
  return hasAction
    ? { status: "GREEN", severity: "LOW" }
    : { status: "YELLOW", severity: "MEDIUM" };
}

function baseRecord(overrides) {
  return {
    inventory_id: "",
    record_type: "",
    screen: null,
    route: null,
    component: null,
    user_action: null,
    api_endpoint: null,
    method: null,
    server_action: null,
    service: [],
    ros_component: [],
    agent: [],
    llm_provider: [],
    db_model: [],
    external_provider: [],
    auth_required: "unknown",
    rbac_required: "unknown",
    tenant_check: "unknown",
    idempotency: "unknown",
    mock_present: false,
    error_handling: false,
    persistence: "unknown",
    test_file: null,
    status: "YELLOW",
    severity: "MEDIUM",
    evidence: null,
    file: null,
    line: null,
    notes: null,
    ...overrides,
  };
}

const files = sourceRoots.flatMap((dir) => walk(path.join(root, dir)));
const pages = files.filter((file) => /\/page\.(tsx|ts|jsx|js)$/.test(file.replaceAll(path.sep, "/")));
const apiFiles = files.filter((file) => /\/route\.(tsx|ts|jsx|js)$/.test(file.replaceAll(path.sep, "/")) && file.replaceAll(path.sep, "/").includes("/src/app/api/"));
const sourceTexts = new Map(files.map((file) => [file, fs.readFileSync(file, "utf8")]));
const inventory = [];
let sequence = 1;

for (const file of pages) {
  const text = sourceTexts.get(file);
  const route = routeFromFile(file, "page");
  const relativeFile = relative(file);
  const hasAction = /onClick\s*=|onSubmit\s*=|onChange\s*=|onKeyDown\s*=|router\.(push|replace)|fetch\s*\(/.test(text);
  const classification = classify(text, "screen", hasAction);
  inventory.push(baseRecord({
    inventory_id: `SCR-${String(sequence++).padStart(5, "0")}`,
    record_type: "screen",
    screen: route,
    route,
    component: relativeFile,
    user_action: "Screen render",
    service: detectServices(text),
    ros_component: detectRos(text),
    agent: detectAgents(text),
    llm_provider: detectProvider(text),
    db_model: detectDbModels(text),
    external_provider: detectProvider(text),
    auth_required: hasAuth(text) || /^\/(admin|employer|candidate|dashboard|profile|onboarding|applications|interviews|billing|settings|subscriptions)/.test(route) ? "yes" : "unknown",
    rbac_required: hasRbac(text) ? "yes" : "unknown",
    tenant_check: hasTenant(text) ? "yes" : "unknown",
    idempotency: hasIdempotency(text) ? "yes" : "unknown",
    mock_present: hasMock(text),
    error_handling: hasErrorHandling(text),
    persistence: detectDbModels(text).length ? "referenced" : "none/unknown",
    status: classification.status,
    severity: classification.severity,
    evidence: fileLineEvidence(file, 1, `screen route ${route}`),
    file: relativeFile,
    line: 1,
    notes: hasAction ? "Interactive handlers detected; action-level rows follow." : "No interactive handler detected by static scan.",
  }));

  const events = allMatches(text, /\b(onClick|onSubmit|onChange|onKeyDown|onBlur)\s*=|\b(router\.(push|replace))\s*\(/g);
  for (const event of events) {
    const line = lineAt(text, event.index);
    const nearby = text.slice(Math.max(0, event.index - 300), Math.min(text.length, event.index + 900));
    const apiMatches = allMatches(nearby, /fetch\s*\(\s*["'`]([^"'`]+)["'`]/g).map((m) => m[1]);
    const classificationAction = classify(nearby, "action", true);
    inventory.push(baseRecord({
      inventory_id: `ACT-${String(sequence++).padStart(5, "0")}`,
      record_type: "user_action",
      screen: route,
      route,
      component: relativeFile,
      user_action: `${event[1]} handler`,
      api_endpoint: unique(apiMatches),
      method: apiMatches.length ? "see endpoint row" : null,
      service: detectServices(nearby),
      ros_component: detectRos(nearby),
      agent: detectAgents(nearby),
      llm_provider: detectProvider(nearby),
      db_model: detectDbModels(nearby),
      external_provider: detectProvider(nearby),
      auth_required: hasAuth(text) ? "yes" : "unknown",
      rbac_required: hasRbac(text) ? "yes" : "unknown",
      tenant_check: hasTenant(text) ? "yes" : "unknown",
      idempotency: hasIdempotency(nearby) ? "yes" : "unknown",
      mock_present: hasMock(nearby),
      error_handling: hasErrorHandling(nearby),
      persistence: detectDbModels(nearby).length ? "referenced" : "unknown",
      status: classificationAction.status,
      severity: classificationAction.severity,
      evidence: fileLineEvidence(file, line, `${event[1]} handler`),
      file: relativeFile,
      line,
      notes: apiMatches.length ? "Static nearby fetch association; verify exact handler path." : "No nearby API call detected; verify whether UI-only is intentional.",
    }));
  }

  const fetches = allMatches(text, /fetch\s*\(\s*["'`]([^"'`]+)["'`]/g);
  for (const fetch of fetches) {
    const endpoint = fetch[1];
    if (!endpoint.startsWith("/api")) continue;
    const line = lineAt(text, fetch.index);
    const nearby = text.slice(fetch.index, Math.min(text.length, fetch.index + 500));
    const method = nearby.match(/method\s*:\s*["']([A-Z]+)["']/i)?.[1]?.toUpperCase() || "GET";
    const classificationApi = classify(text, "action", true);
    inventory.push(baseRecord({
      inventory_id: `CALL-${String(sequence++).padStart(5, "0")}`,
      record_type: "frontend_api_call",
      screen: route,
      route,
      component: relativeFile,
      user_action: `fetch ${method} ${endpoint}`,
      api_endpoint: endpoint,
      method,
      service: detectServices(text),
      ros_component: detectRos(text),
      agent: detectAgents(text),
      llm_provider: detectProvider(text),
      db_model: detectDbModels(text),
      external_provider: detectProvider(text),
      auth_required: hasAuth(text) ? "yes" : "unknown",
      rbac_required: hasRbac(text) ? "yes" : "unknown",
      tenant_check: hasTenant(text) ? "yes" : "unknown",
      idempotency: hasIdempotency(nearby) ? "yes" : "unknown",
      mock_present: hasMock(text),
      error_handling: hasErrorHandling(text),
      persistence: detectDbModels(text).length ? "referenced" : "unknown",
      status: classificationApi.status,
      severity: classificationApi.severity,
      evidence: fileLineEvidence(file, line, `frontend call ${method} ${endpoint}`),
      file: relativeFile,
      line,
      notes: "Must reconcile against an API endpoint row.",
    }));
  }
}

for (const file of apiFiles) {
  const text = sourceTexts.get(file);
  const route = routeFromFile(file, "route");
  const relativeFile = relative(file);
  const methods = allMatches(text, /export\s+(?:async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)\b/g);
  const methodMatches = methods.length ? methods : [{ 1: "UNKNOWN", index: 0 }];
  for (const methodMatch of methodMatches) {
    const method = methodMatch[1];
    const line = lineAt(text, methodMatch.index);
    const models = detectDbModels(text);
    const services = detectServices(text);
    const mock = hasMock(text);
    const classification = classify(text, "endpoint", true);
    const callerScreens = pages.filter((page) => {
      const pageText = sourceTexts.get(page);
      return pageText.includes(route) || pageText.includes(route.replace(/:([A-Za-z0-9_]+)\*?/g, ""));
    }).map((page) => routeFromFile(page, "page"));
    inventory.push(baseRecord({
      inventory_id: `API-${String(sequence++).padStart(5, "0")}`,
      record_type: "api_endpoint",
      screen: callerScreens,
      route,
      component: relativeFile,
      user_action: callerScreens.length ? "Called by frontend screen(s)" : "No statically matched frontend caller",
      api_endpoint: route,
      method,
      server_action: null,
      service: services,
      ros_component: detectRos(text),
      agent: detectAgents(text),
      llm_provider: detectProvider(text),
      db_model: models,
      external_provider: detectProvider(text),
      auth_required: hasAuth(text) ? "yes" : "no/unknown",
      rbac_required: hasRbac(text) ? "yes" : "unknown",
      tenant_check: hasTenant(text) ? "yes" : "unknown",
      idempotency: hasIdempotency(text) ? "yes" : "unknown",
      mock_present: mock,
      error_handling: hasErrorHandling(text),
      persistence: models.length || services.length ? "referenced" : "none/unknown",
      test_file: null,
      status: classification.status,
      severity: classification.severity,
      evidence: fileLineEvidence(file, line, `${method} ${route}`),
      file: relativeFile,
      line,
      notes: callerScreens.length ? `${callerScreens.length} statically matched caller(s).` : "Endpoint may be orphaned or called dynamically.",
    }));
  }
}

const serverActionFiles = files.filter((file) => /["']use server["']/.test(sourceTexts.get(file)));
for (const file of serverActionFiles) {
  const text = sourceTexts.get(file);
  inventory.push(baseRecord({
    inventory_id: `SRV-${String(sequence++).padStart(5, "0")}`,
    record_type: "server_action",
    component: relative(file),
    server_action: relative(file),
    service: detectServices(text),
    ros_component: detectRos(text),
    agent: detectAgents(text),
    llm_provider: detectProvider(text),
    db_model: detectDbModels(text),
    external_provider: detectProvider(text),
    auth_required: hasAuth(text) ? "yes" : "unknown",
    rbac_required: hasRbac(text) ? "yes" : "unknown",
    tenant_check: hasTenant(text) ? "yes" : "unknown",
    idempotency: hasIdempotency(text) ? "yes" : "unknown",
    mock_present: hasMock(text),
    error_handling: hasErrorHandling(text),
    persistence: detectDbModels(text).length ? "referenced" : "unknown",
    status: classify(text, "endpoint", true).status,
    severity: classify(text, "endpoint", true).severity,
    evidence: fileLineEvidence(file, 1, "server action marker"),
    file: relative(file),
    line: 1,
  }));
}

const fields = Object.keys(baseRecord({}));
const json = {
  generated_at: new Date().toISOString(),
  repository: path.basename(root),
  scanner: "scripts/generate-production-wiring-inventory.mjs",
  source_counts: {
    screens: pages.length,
    api_route_files: apiFiles.length,
    server_action_files: serverActionFiles.length,
    source_files_scanned: files.length,
  },
  records: inventory,
  reconciliation: {
    screen_records: inventory.filter((r) => r.record_type === "screen").length,
    user_action_records: inventory.filter((r) => r.record_type === "user_action").length,
    frontend_api_call_records: inventory.filter((r) => r.record_type === "frontend_api_call").length,
    api_endpoint_records: inventory.filter((r) => r.record_type === "api_endpoint").length,
    server_action_records: inventory.filter((r) => r.record_type === "server_action").length,
    records_missing_evidence: inventory.filter((r) => !r.evidence).length,
    red_records: inventory.filter((r) => r.status === "RED").length,
    black_records: inventory.filter((r) => r.status === "BLACK").length,
  },
};

fs.writeFileSync(outputJson, JSON.stringify(json, null, 2) + "\n", "utf8");
fs.writeFileSync(outputCsv, [fields.join(","), ...inventory.map((record) => fields.map((field) => csvValue(record[field])).join(","))].join("\n") + "\n", "utf8");

console.log(JSON.stringify({ outputJson: relative(outputJson), outputCsv: relative(outputCsv), ...json.source_counts, records: inventory.length, reconciliation: json.reconciliation }, null, 2));
