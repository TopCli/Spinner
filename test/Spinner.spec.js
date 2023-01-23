// Import Node.js Dependencies
import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Import Third-party Dependencies
import is from "@slimio/is";

// Import Internal Dependencies
import { Spinner } from "../index.js";

describe("Spinner", () => {
  it("should export a JavaScript class", () => {
    assert.ok(is.classObject(Spinner));
  });
});
