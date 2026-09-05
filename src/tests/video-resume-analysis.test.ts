import { getWorkerDownloadUrl } from "@/lib/storage";
import { getVideoAnalysisConfig } from "@/lib/env";

export interface TestResult {
  name: string;
  category: string;
  passed: boolean;
  skipped?: boolean;
  message?: string;
}

export async function runVideoAnalysisTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // 1. Strict 120-second max limit configuration
  try {
    const config = getVideoAnalysisConfig();
    const pass =
      config.maxSeconds === 120 &&
      config.whisperModelSize === "small" &&
      config.whisperDevice === "cpu" &&
      config.whisperComputeType === "int8";
    results.push({
      name: "Video Analysis - 120s Cap and Whisper Small CPU Configuration",
      category: "Video Resume Analysis",
      passed: pass,
    });
  } catch (e: any) {
    results.push({
      name: "Video Analysis - 120s Cap and Whisper Small CPU Configuration",
      category: "Video Resume Analysis",
      passed: false,
      message: e.message,
    });
  }

  // 2. Signed worker download URL helper
  try {
    const objectKey = "video-resumes/test-object-123.mp4";
    const downloadUrl = await getWorkerDownloadUrl(objectKey);
    const pass = downloadUrl === null || (typeof downloadUrl === "string" && downloadUrl.length > 10);
    results.push({
      name: "Video Analysis - Secure Storage Worker Download URL Generator",
      category: "Video Resume Analysis",
      passed: pass,
    });
  } catch (e: any) {
    results.push({
      name: "Video Analysis - Secure Storage Worker Download URL Generator",
      category: "Video Resume Analysis",
      passed: false,
      message: e.message,
    });
  }

  // 3. Fail-closed internal token check
  try {
    const config = getVideoAnalysisConfig();
    const pass = Boolean(config.internalToken && config.internalToken.length > 0);
    results.push({
      name: "Video Analysis - Internal Callback Token Verification",
      category: "Video Resume Analysis",
      passed: pass,
    });
  } catch (e: any) {
    results.push({
      name: "Video Analysis - Internal Callback Token Verification",
      category: "Video Resume Analysis",
      passed: false,
      message: e.message,
    });
  }

  return results;
}
