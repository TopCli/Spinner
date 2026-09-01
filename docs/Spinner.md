# Spinner

`Spinner` displays the state of one task. Several instances can run together on
the same stream; the shared renderer redraws them as one terminal block.

```ts
import { Spinner } from "@topcli/spinner";

const spinner = new Spinner({ name: "dots2", color: "cyan" });

spinner.start("Downloading");
spinner.text = "Extracting";
spinner.succeed(`Ready in ${spinner.elapsedTime.toFixed(0)}ms`);
```

Interactive terminals receive animated output. Non-TTY streams and CI receive
plain start and settlement lines without ANSI layout commands. Set
`verbose: false` to write nothing.

## Constructor

### `new Spinner(options?)`

```ts
new Spinner(options?: SpinnerOptions)

interface SpinnerOptions {
  /**
   * @default "dots"
   */
  name?: cliSpinners.SpinnerName;
  color?: Color;
  /**
   * @default true
   */
  verbose?: boolean;
  /**
   * Non-TTY streams receive one plain line. @default process.stdout
   */
  stream?: SpinnerStream;
  /**
   * @default true
   */
  hideCursor?: boolean;
  /**
   * Prevents input from being echoed into the rendered block. @default true
   */
  discardStdin?: boolean;
}
```

Creates an idle spinner. `name` accepts any animation from
[`cli-spinners`](https://github.com/sindresorhus/cli-spinners#readme). `color`
accepts a format supported by Node.js `util.styleText`; omit it to keep the
terminal's current color.

`stream` controls where the spinner is rendered. `hideCursor` and
`discardStdin` apply while this spinner is active, and the renderer restores
terminal state after the last participating spinner settles.

## Properties

### `stream`

```ts
readonly stream: SpinnerStream
```

The writable stream passed to the constructor. It defaults to `process.stdout`.

### `started`

```ts
readonly started: boolean
```

`true` between `start()` and `succeed()`, `failed()` or `stop()`.

### `verbose`

```ts
readonly verbose: boolean
```

Whether this spinner writes output.

### `startTime` / `elapsedTime`

```ts
readonly startTime: number | undefined
readonly elapsedTime: number
```

`startTime` is the most recent start time from `performance.now()`. It is
`undefined` before the first start. `elapsedTime` returns the milliseconds since
that start, or `0` before the spinner has started.

### `text`

```ts
get text(): string | undefined
set text(value: string | undefined)
```

The current task text. Assigning `undefined` leaves it unchanged. Terminal
layout control characters are removed from assigned text.

## Methods

### `start(text?, options?)`

```ts
start(text?: string, options?: StartOptions): this

interface StartOptions {
  withPrefix?: string;
}
```

Starts rendering and emits `start`. `withPrefix` is inserted before the task
text. Calling `start()` on a running spinner has no effect.

### `succeed(text?)`

```ts
succeed(text?: string): this
```

Settles the spinner with a green success symbol and emits `succeed`. When
`text` is omitted, the current text is kept. Calling it on an idle spinner has
no effect.

### `failed(text?)`

```ts
failed(text?: string): this
```

Settles the spinner with a red failure symbol and emits `failed`. When `text` is
omitted, the current text is kept. Calling it on an idle spinner has no effect.

### `stop()`

```ts
stop(): this
```

Removes the spinner without a settlement line and emits `stopped`. Other active
spinners move up to fill the freed row. Calling it on an idle spinner has no
effect.

## Events

```ts
spinner.on("start", listener)
spinner.on("succeed", listener)
spinner.on("failed", listener)
spinner.on("stopped", listener)
```

Each event fires without arguments after the corresponding state change.

## Types

### `Color`

```ts
type Color = Parameters<typeof styleText>[0]
```

One format or a format array accepted by Node.js `util.styleText`.

### `SpinnerStream`

```ts
interface SpinnerStream extends NodeJS.WritableStream {
  isTTY?: boolean;
  columns?: number;
  rows?: number;
}
```

The stream contract used for rendering. Animation requires `isTTY: true`, a
`TERM` value other than `dumb`, and no `CI` environment variable.
