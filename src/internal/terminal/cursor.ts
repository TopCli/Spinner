// Import Internal Dependencies
import { ESCAPES } from "./ansi.ts";
import type { SpinnerStream } from "../../types.ts";

const kExitSignals = ["SIGINT", "SIGTERM", "SIGHUP"] as const;

const hiddenStreams = new Set<SpinnerStream>();
let exitHooksInstalled = false;

function restoreAll() {
  for (const stream of hiddenStreams) {
    stream.write(ESCAPES.showCursor);
  }
  hiddenStreams.clear();
}

function installExitHooks() {
  if (exitHooksInstalled) {
    return;
  }
  exitHooksInstalled = true;

  process.once("exit", restoreAll);
  for (const signal of kExitSignals) {
    process.once(signal, () => {
      restoreAll();

      if (process.listenerCount(signal) === 0) {
        process.kill(process.pid, signal);
      }
    });
  }
}

export function hideCursor(
  stream: SpinnerStream
): void {
  if (!stream.isTTY || hiddenStreams.has(stream)) {
    return;
  }

  installExitHooks();
  hiddenStreams.add(stream);
  stream.write(ESCAPES.hideCursor);
}

export function showCursor(
  stream: SpinnerStream
): void {
  if (!hiddenStreams.delete(stream)) {
    return;
  }

  stream.write(ESCAPES.showCursor);
}
