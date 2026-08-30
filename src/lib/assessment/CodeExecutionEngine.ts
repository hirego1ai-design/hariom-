import { z } from "zod";

export enum SubmissionStatus {
  ACCEPTED = "ACCEPTED",
  WRONG_ANSWER = "WRONG_ANSWER",
  TIME_LIMIT_EXCEEDED = "TIME_LIMIT_EXCEEDED",
  COMPILE_ERROR = "COMPILE_ERROR",
  RUNTIME_ERROR = "RUNTIME_ERROR",
  INTERNAL_ERROR = "INTERNAL_ERROR",
}

export interface TestCase {
  input: string;
  expectedOutput: string;
}

export interface TestCaseResult {
  input: string;
  expected: string;
  actual: string;
  passed: boolean;
  runtimeMs: number;
}

export interface ExecutionResult {
  status: SubmissionStatus;
  passedTests: number;
  totalTests: number;
  runtimeMs: number;
  results: TestCaseResult[];
  stdout: string;
  stderr: string;
}

export class CodeRunnerUnavailableError extends Error {
  status = 503;

  constructor(message = "The isolated code runner is not configured.") {
    super(message);
    this.name = "CodeRunnerUnavailableError";
  }
}

const executionResultSchema = z.object({
  status: z.nativeEnum(SubmissionStatus),
  passedTests: z.number().int().nonnegative(),
  totalTests: z.number().int().nonnegative(),
  runtimeMs: z.number().nonnegative(),
  results: z.array(z.object({
    input: z.string(),
    expected: z.string(),
    actual: z.string(),
    passed: z.boolean(),
    runtimeMs: z.number().nonnegative(),
  })),
  stdout: z.string(),
  stderr: z.string(),
}).strict();

function getCodeRunnerEndpoint(): string {
  const configuredUrl = process.env.CODE_RUNNER_URL;
  const apiKey = process.env.CODE_RUNNER_API_KEY;
  if (!configuredUrl || !apiKey) throw new CodeRunnerUnavailableError();

  let endpoint: URL;
  try {
    endpoint = new URL(configuredUrl);
  } catch {
    throw new CodeRunnerUnavailableError("CODE_RUNNER_URL is invalid.");
  }
  if (process.env.NODE_ENV === "production" && endpoint.protocol !== "https:") {
    throw new CodeRunnerUnavailableError("CODE_RUNNER_URL must use HTTPS in production.");
  }
  return `${endpoint.toString().replace(/\/$/, "")}/execute`;
}

/** Candidate code runs only in a separately isolated service, never in Next.js. */
export async function executeCode(
  code: string,
  language: string,
  testCases: TestCase[],
  timeLimitMs = 2000,
  memoryLimitMb = 128,
): Promise<ExecutionResult> {
  const endpoint = getCodeRunnerEndpoint();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Math.max(timeLimitMs + 5_000, 10_000));

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "authorization": `Bearer ${process.env.CODE_RUNNER_API_KEY!}`,
      },
      body: JSON.stringify({ code, language, testCases, timeLimitMs, memoryLimitMb }),
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new CodeRunnerUnavailableError(`The isolated code runner returned HTTP ${response.status}.`);
    }

    const parsed = executionResultSchema.safeParse(await response.json());
    if (!parsed.success) {
      throw new CodeRunnerUnavailableError("The isolated code runner returned an invalid result.");
    }
    return parsed.data;
  } catch (error) {
    if (error instanceof CodeRunnerUnavailableError) throw error;
    throw new CodeRunnerUnavailableError(
      error instanceof Error && error.name === "AbortError"
        ? "The isolated code runner did not respond in time."
        : "The isolated code runner is unavailable.",
    );
  } finally {
    clearTimeout(timeout);
  }
}

export function computeScore(passedTests: number, totalTests: number): number {
  return totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
}
