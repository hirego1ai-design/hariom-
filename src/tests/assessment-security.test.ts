import {
  CodeRunnerUnavailableError,
  executeCode,
  SubmissionStatus,
} from "@/lib/assessment/CodeExecutionEngine";

export interface AssessmentTestResult {
  name: string;
  category: string;
  passed: boolean;
  message?: string;
}

export async function runAssessmentSecurityTests(): Promise<{ results: AssessmentTestResult[] }> {
  const results: AssessmentTestResult[] = [];
  const originalUrl = process.env.CODE_RUNNER_URL;
  const originalKey = process.env.CODE_RUNNER_API_KEY;
  const originalFetch = globalThis.fetch;

  try {
    delete process.env.CODE_RUNNER_URL;
    delete process.env.CODE_RUNNER_API_KEY;
    let failClosed = false;
    try {
      await executeCode("console.log('test')", "javascript", [{ input: "", expectedOutput: "test" }]);
    } catch (error) {
      failClosed = error instanceof CodeRunnerUnavailableError && error.status === 503;
    }
    results.push({
      name: "Code runner is unavailable without credentials instead of executing locally",
      category: "Assessment security",
      passed: failClosed,
    });

    process.env.CODE_RUNNER_URL = "https://runner.hirego.test";
    process.env.CODE_RUNNER_API_KEY = "test-runner-key";
    let requestedEndpoint = "";
    (globalThis as typeof globalThis & { fetch: typeof fetch }).fetch = async (input) => {
      requestedEndpoint = String(input);
      return new Response(JSON.stringify({
        status: SubmissionStatus.ACCEPTED,
        passedTests: 1,
        totalTests: 1,
        runtimeMs: 4,
        results: [{ input: "", expected: "test", actual: "test", passed: true, runtimeMs: 4 }],
        stdout: "test",
        stderr: "",
      }), { status: 200, headers: { "content-type": "application/json" } });
    };

    const result = await executeCode("console.log('test')", "javascript", [{ input: "", expectedOutput: "test" }]);
    results.push({
      name: "Code runner adapter validates an isolated runner result",
      category: "Assessment security",
      passed: requestedEndpoint === "https://runner.hirego.test/execute" && result.status === SubmissionStatus.ACCEPTED && result.passedTests === 1,
    });
  } catch (error) {
    results.push({
      name: "Assessment security test setup",
      category: "Assessment security",
      passed: false,
      message: error instanceof Error ? error.message : "Unknown error",
    });
  } finally {
    globalThis.fetch = originalFetch;
    if (originalUrl === undefined) delete process.env.CODE_RUNNER_URL;
    else process.env.CODE_RUNNER_URL = originalUrl;
    if (originalKey === undefined) delete process.env.CODE_RUNNER_API_KEY;
    else process.env.CODE_RUNNER_API_KEY = originalKey;
  }

  return { results };
}
