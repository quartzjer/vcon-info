import { describe, test, expect } from "bun:test";
import { compareVersions } from "../../docs/utils.js";
import { checkVersionSpecificFields } from "../../docs/validator.js";

describe("Version utilities", () => {
  test("compareVersions compares numeric components correctly", () => {
    expect(compareVersions("0.10.0", "0.2.0")).toBe(1);
    expect(compareVersions("0.3.0", "0.3.0")).toBe(0);
    expect(compareVersions("0.1.5", "0.1.10")).toBeLessThan(0);
  });

  test("checkVersionSpecificFields uses numeric comparison", () => {
    const vcon = { transfer_target: "x" };
    const resNew = checkVersionSpecificFields(vcon, "0.10.0");
    expect(resNew.warnings.length).toBe(0);

    const resOld = checkVersionSpecificFields(vcon, "0.2.0");
    expect(resOld.warnings.some(w => w.includes("transfer_target not available"))).toBe(true);
  });
});
