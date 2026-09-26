import assert from "node:assert/strict";
import test from "node:test";
import { selectCopilotRegionalPrice } from "../lib/copilot/commerce";
import { copilotCapacityLevel } from "../lib/copilot/capacity";
import {
  copilotPurchaseSnapshotSchema,
  createCopilotPurchaseSnapshot,
} from "../lib/copilot/purchaseSnapshot";

test("Copilot regional pricing chooses an explicit country before ROW fallback", () => {
  const prices = [
    { id: "eu", regionCode: "EU", countries: ["DE", "FR"], isActive: true },
    { id: "row", regionCode: "ROW", countries: [], isActive: true },
  ];
  assert.equal(selectCopilotRegionalPrice(prices, "DE")?.id, "eu");
  assert.equal(selectCopilotRegionalPrice(prices, "US")?.id, "row");
});

test("inactive regional prices are never selected", () => {
  const prices = [
    { id: "us", regionCode: "US", countries: ["US"], isActive: false },
    { id: "row", regionCode: "ROW", countries: [], isActive: true },
  ];
  assert.equal(selectCopilotRegionalPrice(prices, "US")?.id, "row");
});

test("Copilot capacity exposes status bands without exposing raw internal units", () => {
  assert.equal(copilotCapacityLevel(10, 80, 90), "NORMAL");
  assert.equal(copilotCapacityLevel(80, 80, 90), "MODERATE");
  assert.equal(copilotCapacityLevel(90, 80, 90), "HIGH");
  assert.equal(copilotCapacityLevel(100, 80, 90), "REACHED");
});

test("Copilot purchase snapshot binds price, country, tax route and hidden plan capacity", () => {
  const snapshot = createCopilotPurchaseSnapshot({
    planId: "copilot-growth",
    planCode: "GROWTH",
    planName: "Growth",
    description: "Growth plan",
    validityMonths: 1,
    featuresAllowed: ["PROFILE_MATCHING"],
    priceId: "price-us-growth",
    regionCode: "US",
    countryCode: "US",
    currency: "USD",
    amountMinor: 1900,
    amount: 19,
    taxMode: "TAX_EXCLUSIVE",
    paymentRoute: "STRIPE",
  }, {
    monthlyCapacityUnits: 300,
    softWarningPct: 80,
    hardWarningPct: 90,
  });

  assert.equal(snapshot.productType, "COPILOT");
  assert.equal(snapshot.billingCountry, "US");
  assert.equal(snapshot.amountMinor, 1900);
  assert.equal(snapshot.monthlyCapacityUnits, 300);
});

test("Copilot purchase snapshot rejects invalid warning thresholds", () => {
  const invalid = {
    version: 1,
    productType: "COPILOT",
    planId: "copilot",
    planCode: "COPILOT",
    planName: "Copilot",
    billingCountry: "US",
    regionCode: "US",
    currency: "USD",
    amountMinor: 1000,
    taxMode: "TAX_EXCLUSIVE",
    paymentRoute: "STRIPE",
    validityMonths: 1,
    monthlyCapacityUnits: 100,
    softWarningPct: 95,
    hardWarningPct: 90,
    featuresAllowed: [],
  };
  assert.equal(copilotPurchaseSnapshotSchema.safeParse(invalid).success, false);
});
