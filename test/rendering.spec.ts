// Import Node.js Dependencies
import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { PassThrough } from "node:stream";
import { stripVTControlCharacters, styleText } from "node:util";

// Import Internal Dependencies
import { Spinner, type SpinnerStream } from "../src/index.ts";
import { ESCAPES, cursorUp } from "../src/internal/terminal/ansi.ts";

const kUnicodeSupported = process.platform !== "win32" ||
  Boolean(process.env.CI) ||
  process.env.TERM === "xterm-256color";
const kSuccessSymbol = kUnicodeSupported ? "✔" : "√";

interface FakeStream extends SpinnerStream {
  output(): string;
  lines(): string[];
  clear(): void;
}

function fakeStream(
  options: { isTTY?: boolean; columns?: number; } = {}
): FakeStream {
  const { isTTY = true, columns = 80 } = options;

  const stream = new PassThrough() as unknown as FakeStream;
  const chunks: string[] = [];

  stream.isTTY = isTTY;
  stream.columns = columns;
  stream.on("data", (chunk: Buffer) => chunks.push(chunk.toString()));
  stream.output = () => chunks.join("");
  stream.lines = () => stream
    .output()
    .split("\n")
    .map((line) => stripVTControlCharacters(line).trim())
    .filter((line) => line !== "");
  stream.clear = () => {
    chunks.length = 0;
  };

  return stream;
}

describe("rendering", () => {
  // Animations are disabled on a CI (see isInteractive).
  let ci: string | undefined;
  let term: string | undefined;

  before(() => {
    ci = process.env.CI;
    term = process.env.TERM;
    delete process.env.CI;
    process.env.TERM = "xterm-256color";
  });
  after(() => {
    if (ci === undefined) {
      delete process.env.CI;
    }
    else {
      process.env.CI = ci;
    }
    if (term === undefined) {
      delete process.env.TERM;
    }
    else {
      process.env.TERM = term;
    }
  });

  it("should paint one line and hide the cursor when started", () => {
    const stream = fakeStream();
    const spinner = new Spinner({ stream }).start("foobar");

    const output = stream.output();
    assert.ok(output.startsWith(ESCAPES.hideCursor), "cursor must be hidden first");
    assert.ok(output.includes(ESCAPES.clearLine), "the line must be cleared before being written");
    assert.deepEqual(stream.lines(), ["⠋ foobar"]);
    assert.ok(!output.includes(cursorUp(1)), "there is nothing to move up for the very first line");

    spinner.stop();
  });

  it("should not paint anything twice when start() is called twice", () => {
    const stream = fakeStream();
    const spinner = new Spinner({ stream }).start("first");
    spinner.start("second");

    assert.deepEqual(stream.lines(), ["⠋ first"], "the second start must be a no-op");
    assert.equal(spinner.text, "first");

    spinner.stop();
  });

  it("should repaint the whole block when a second spinner starts", () => {
    const stream = fakeStream();
    const first = new Spinner({ stream }).start("first");
    stream.clear();
    const second = new Spinner({ stream }).start("second");

    assert.ok(stream.output().includes(cursorUp(1)), "must move back to the top of the block");
    assert.deepEqual(stream.lines(), ["⠋ first", "⠋ second"]);

    first.stop();
    second.stop();
  });

  it("should only erase its own line when a spinner is stopped", () => {
    const stream = fakeStream();
    const first = new Spinner({ stream }).start("first");
    const second = new Spinner({ stream }).start("second");

    stream.clear();
    first.stop();

    assert.deepEqual(stream.lines(), ["⠋ second"], "the remaining spinner must be repainted");
    assert.ok(stream.output().includes(cursorUp(2)), "must repaint from the top of the block");

    second.stop();
  });

  it("should keep the cursor hidden until the last spinner is done", () => {
    const stream = fakeStream();
    const first = new Spinner({ stream }).start("first");
    const second = new Spinner({ stream }).start("second");

    first.succeed("first done");
    assert.ok(!stream.output().includes(ESCAPES.showCursor), "another spinner is still running");

    stream.clear();
    second.succeed("second done");
    assert.ok(stream.output().endsWith(ESCAPES.showCursor), "the cursor must be restored");
    assert.deepEqual(
      stream.lines(),
      [`${kSuccessSymbol} first done`, `${kSuccessSymbol} second done`]
    );
  });

  it("should reconcile cursor ownership for spinners with different options", () => {
    const stream = fakeStream();
    const first = new Spinner({
      stream,
      hideCursor: false,
      discardStdin: false
    }).start("first");
    const second = new Spinner({ stream }).start("second");

    assert.ok(
      stream.output().includes(ESCAPES.hideCursor),
      "a later spinner must be able to claim the cursor"
    );

    stream.clear();
    second.succeed("second done");
    assert.ok(
      stream.output().endsWith(ESCAPES.showCursor),
      "the cursor must be restored when only opted-out spinners remain"
    );

    first.stop();
  });

  it("should give every restart a new renderer session", () => {
    const stream = fakeStream();
    const first = new Spinner({ stream }).start("first");
    const second = new Spinner({ stream }).start("second");

    first.succeed("first done");
    stream.clear();
    first.start("first again");

    assert.deepEqual(
      stream.lines(),
      [`${kSuccessSymbol} first done`, "⠋ second", "⠋ first again"],
      "the completed row must be an immutable snapshot, not a duplicated live row"
    );

    second.stop();
    first.stop();
  });

  it("should start a brand new block once everything settled", () => {
    const stream = fakeStream();
    new Spinner({ stream }).start("first").succeed("done");

    stream.clear();
    const spinner = new Spinner({ stream }).start("second");

    assert.ok(!stream.output().includes(cursorUp(1)), "persisted lines must not be repainted");
    assert.deepEqual(stream.lines(), ["⠋ second"]);

    spinner.stop();
  });

  it("should truncate the line to the terminal width", () => {
    const stream = fakeStream({ columns: 20 });
    const spinner = new Spinner({ stream }).start("日本語のテキストはとても長いです");

    // 2 columns for the frame + 8 wide characters (16 columns) = 18 columns:
    // one column is always left free to avoid an automatic line wrap.
    assert.deepEqual(stream.lines(), ["⠋ 日本語のテキスト"]);

    spinner.stop();
  });

  it("should strip the control characters of the text and of the prefix", () => {
    const stream = fakeStream();
    const spinner = new Spinner({ stream })
      .start("foo\nbar", { withPrefix: "pre\tfix " });

    assert.deepEqual(stream.lines(), ["⠋ prefix foobar"]);

    spinner.stop();
  });

  it("should preserve styles but strip terminal layout commands", () => {
    const stream = fakeStream();
    const clearScreen = `${String.fromCharCode(0x1B)}[2J`;
    const styled = styleText("red", "styled", { validateStream: false });
    const spinner = new Spinner({ stream })
      .start(`${clearScreen}${styled}`);

    assert.ok(!stream.output().includes(clearScreen));
    assert.ok(stream.output().includes(styled));
    assert.deepEqual(stream.lines(), ["⠋ styled"]);

    spinner.stop();
  });

  it("should keep the rendering mode selected at start until settlement", () => {
    const stream = fakeStream();
    const animated = new Spinner({ stream }).start("animated");

    process.env.CI = "1";
    try {
      animated.stop();
      assert.ok(stream.output().endsWith(ESCAPES.showCursor));
    }
    finally {
      delete process.env.CI;
    }

    stream.clear();
    process.env.CI = "1";
    const plain = new Spinner({ stream }).start("plain");
    delete process.env.CI;
    plain.succeed("plain done");

    assert.deepEqual(
      stream.lines(),
      ["- plain", `${kSuccessSymbol} plain done`]
    );
  });

  it("should write plain lines (no escape sequence) on a non-interactive stream", () => {
    const stream = fakeStream({ isTTY: false });
    const spinner = new Spinner({ stream });

    spinner.start("working");
    spinner.succeed("done");

    const output = stream.output();
    assert.equal(output, stripVTControlCharacters(output), "no ANSI escape sequence expected");
    assert.deepEqual(stream.lines(), ["- working", `${kSuccessSymbol} done`]);
  });

  it("should write nothing at all when verbose is disabled", () => {
    const stream = fakeStream();
    const spinner = new Spinner({ stream, verbose: false });

    spinner.start("working").succeed("done");

    assert.equal(stream.output(), "");
  });

  it("should not hide the cursor when opted out", () => {
    const stream = fakeStream();
    const spinner = new Spinner({ stream, hideCursor: false, discardStdin: false })
      .start("working");

    assert.ok(!stream.output().includes(ESCAPES.hideCursor));

    spinner.stop();
  });
});
