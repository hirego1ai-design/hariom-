export type StoredFileProcessingState = {
  id: string;
  scanStatus: string;
  deletedAt?: Date | null;
};

export class UnsafeStoredFileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnsafeStoredFileError";
  }
}

/**
 * Single invariant for every parser/OCR/transcription/AI boundary:
 * only a currently-existing file with a successful CLEAN malware scan may be
 * processed. PENDING, SCANNING, ERROR, INFECTED, LEGACY_UNSCANNED and unknown
 * states all fail closed.
 */
export function assertStoredFileSafeForProcessing(file: StoredFileProcessingState | null | undefined): asserts file is StoredFileProcessingState {
  if (!file || file.deletedAt) {
    throw new UnsafeStoredFileError("Stored file is missing or deleted.");
  }
  if (file.scanStatus !== "CLEAN") {
    throw new UnsafeStoredFileError(`Stored file ${file.id} is not cleared for processing.`);
  }
}

export function isStoredFileSafeForProcessing(file: StoredFileProcessingState | null | undefined): boolean {
  try {
    assertStoredFileSafeForProcessing(file);
    return true;
  } catch {
    return false;
  }
}
