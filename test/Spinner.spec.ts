// Import Node.js Dependencies
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";

// Import Third-party Dependencies
import is from "@slimio/is";

// Import Internal Dependencies
import { Spinner } from "../src/index.js";

describe("Spinner", () => {
  it("should export a JavaScript class", () => {
    assert.ok(is.classObject(Spinner));
  });

  describe("reset", () => {
    it("should exist", () => {
      assert.ok(typeof Spinner.reset === "function");
    });
  });

  describe("constructor", () => {
    it("should assert default instance properties", () => {
      const spin = new Spinner();

      assert.equal(spin.started, false);
      assert.ok(spin.verbose);
      assert.equal(typeof spin.elapsedTime, "number");
      assert.equal(spin.startTime, undefined);
      assert.equal(spin.text, "");
    });

    it("should instance class with verbose false", () => {
      const spin = new Spinner({ verbose: false });

      assert.equal(spin.verbose, false);
    });
  });

  describe("setter text", () => {
    it("should return newly set text", () => {
      const spin = new Spinner();

      const expectedText = "foobar";
      spin.text = expectedText;

      assert.equal(spin.text, expectedText);
    });

    it("should not update text if value is undefined", () => {
      const spin = new Spinner();

      const expectedText = "foobar";
      spin.text = expectedText;
      spin.text = void 0;

      assert.equal(spin.text, expectedText);
    });

    it("should remove/strip new line", () => {
      const spin = new Spinner();

      const expectedText = "foobar";
      spin.text = `${expectedText}\n\r${expectedText}`;

      assert.equal(spin.text, expectedText + expectedText);
    });
  });

  describe("start", () => {
    it("should trigger start event", async() => {
      const spin = new Spinner({ verbose: false });

      const expectedText = "foobar";
      setImmediate(() => spin.start(expectedText));

      await once(spin, "start", { signal: AbortSignal.timeout(10) });
      assert.equal(spin.text, expectedText);
      assert.ok(spin.started);
    });

    it("should return the Spinner class instance", () => {
      const spin = new Spinner({ verbose: false });

      assert.equal(spin.start(), spin);
    });
  });

  describe("succeed", () => {
    it("should do nothing if spinner is not started", () => {
      let succeeded = false;

      const spin = new Spinner({ verbose: false });
      spin.once("succeed", () => (succeeded = true));

      const expectedText = "not started";
      spin.text = expectedText;

      const response = spin.succeed("foobar");

      assert.equal(response, spin);
      assert.equal(succeeded, false);
      assert.equal(spin.text, expectedText);
    });

    it("should stop the Spinner and update text", async() => {
      const spin = new Spinner({ verbose: false });
      spin.start();

      const expectedText = "foobar";
      setImmediate(() => spin.succeed(expectedText));

      await once(spin, "succeed", { signal: AbortSignal.timeout(10) });

      assert.equal(spin.text, expectedText);
      assert.equal(spin.started, false);
    });
  });

  describe("failed", () => {
    it("should do nothing if spinner is not started", () => {
      let failed = false;

      const spin = new Spinner({ verbose: false });
      spin.once("failed", () => (failed = true));

      const expectedText = "not started";
      spin.text = expectedText;

      const response = spin.succeed("foobar");

      assert.equal(response, spin);
      assert.equal(failed, false);
      assert.equal(spin.text, expectedText);
    });

    it("should stop the Spinner and update text", async() => {
      const spin = new Spinner({ verbose: false });
      spin.start();

      const expectedText = "foobar";
      setImmediate(() => spin.failed(expectedText));

      await once(spin, "failed", { signal: AbortSignal.timeout(10) });

      assert.equal(spin.text, expectedText);
      assert.equal(spin.started, false);
    });
  });
});
