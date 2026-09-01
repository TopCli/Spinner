# computeWithSpinner

`computeWithSpinner` starts a spinner, passes it to an asynchronous operation
and settles it when the operation finishes. It returns the operation's value and
rethrows its original error.

```ts
import { computeWithSpinner } from "@topcli/spinner";

const response = await computeWithSpinner(
  async(spinner) => {
    const response = await fetch("https://example.com/data.json");
    spinner.text = "Reading response";

    return response.json();
  },
  { text: "Downloading data" },
  {
    success: (elapsedTime) => `Downloaded in ${elapsedTime.toFixed(0)}ms`,
    fail: (error) => `Download failed: ${error.message}`
  }
);
```

## Function

### `computeWithSpinner(asynchronousOp, options, logs?)`

```ts
async function computeWithSpinner<T = void>(
  asynchronousOp: (spinner: Spinner) => Promise<T>,
  options: ComputeSpinnerOptions,
  logs?: SpinnerLoggerOptions
): Promise<T>

interface ComputeSpinnerOptions {
  text: string;
  spinner?: SpinnerOptions;
  withPrefix?: string;
}

interface SpinnerLoggerOptions {
  success?: (elapsedTime: number) => string;
  fail?: (error: Error) => string;
}
```

Creates a [`Spinner`](./Spinner.md) with `options.spinner`, then starts it with
`options.text` and `options.withPrefix`.

When `asynchronousOp` resolves, `success` receives the elapsed time in
milliseconds and its return value becomes the settlement text. When the
operation rejects, `fail` receives an `Error` and its return value becomes the
failure text. If either logger is omitted, the original spinner text is kept.

After a rejection, the function rethrows the value received from the operation.
