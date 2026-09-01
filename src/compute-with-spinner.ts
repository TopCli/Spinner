// Import Internal Dependencies
import {
  Spinner,
  type SpinnerOptions
} from "./spinner.ts";

function kDefaultSafeLogger() {
  return undefined;
}

export interface ComputeSpinnerOptions {
  text: string;
  spinner?: SpinnerOptions;
  withPrefix?: string;
}

export interface SpinnerLoggerOptions {
  success?: (elapsedTime: number) => string;
  fail?: (error: Error) => string;
}

export async function computeWithSpinner<T = void>(
  asynchronousOp: (spinner: Spinner) => Promise<T>,
  options: ComputeSpinnerOptions,
  logs: SpinnerLoggerOptions = {}
): Promise<T> {
  const {
    success = kDefaultSafeLogger,
    fail = kDefaultSafeLogger
  } = logs;

  const spinner = new Spinner(options.spinner).start(
    options.text,
    { withPrefix: options.withPrefix }
  );

  try {
    const response = await asynchronousOp(spinner);
    spinner.succeed(
      success(spinner.elapsedTime)
    );

    return response;
  }
  catch (error) {
    const formattedError = error instanceof Error
      ? error
      : new Error(String(error), { cause: error });
    spinner.failed(
      fail(formattedError)
    );

    throw error;
  }
}
