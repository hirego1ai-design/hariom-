export type CopilotTaxModeValue =
  | "NO_TAX_COLLECTION"
  | "TAX_EXCLUSIVE"
  | "TAX_INCLUSIVE"
  | "MERCHANT_OF_RECORD";

export function assertCurrentCopilotTaxPolicy(input: {
  regionCode: string;
  countries: string[];
  taxMode: CopilotTaxModeValue;
  taxRateBps: number;
}) {
  const regionCode = input.regionCode.toUpperCase();
  const countries = input.countries.map((value) => value.toUpperCase());
  const isIndia = regionCode === "IN" || (countries.length === 1 && countries[0] === "IN");
  const containsIndia = countries.includes("IN");

  if (containsIndia && !isIndia) {
    throw new Error("India must use a dedicated Copilot pricing region so GST is not mixed with international billing.");
  }

  if (isIndia) {
    if (input.taxMode !== "TAX_EXCLUSIVE" && input.taxMode !== "TAX_INCLUSIVE") {
      throw new Error("India Copilot pricing must collect configured GST.");
    }
    if (!Number.isInteger(input.taxRateBps) || input.taxRateBps <= 0 || input.taxRateBps > 10_000) {
      throw new Error("India Copilot pricing requires a valid positive GST rate.");
    }
    return;
  }

  if (input.taxMode !== "NO_TAX_COLLECTION" || input.taxRateBps !== 0) {
    throw new Error("Current HireGo policy collects transaction tax only for India. Non-India regions must use no-tax collection with a zero tax rate.");
  }
}
