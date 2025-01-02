// Import Internal Dependencies
import {
  Spinner,
  type ISpinnerOptions
} from "./Spinner.class.js";

// CONSTANTS
// eslint-disable-next-line func-style
const kDefaultSafeLogger = () => undefined;

export interface IComputeSpinnerOptions {
  text: string;
  spinner?: Omit<ISpinnerOptions, "verbose">;
  withPrefix?: string;
}

export interface ISpinnerLoggerOptions {
  success?: (elapsedTime: number) => string;
  fail?: (error: Error) => string;
}

export async function computeWithSpinner<T = void>(
  asynchronousOp: (spinner: Spinner) => Promise<T>,
  options: IComputeSpinnerOptions,
  logs: ISpinnerLoggerOptions = {}
): Promise<T> {
  const { success = kDefaultSafeLogger, fail = kDefaultSafeLogger } = logs;
  const spinner = new Spinner(options.spinner)
    .start(options.text, { withPrefix: options.withPrefix });

  try {
    const response = await asynchronousOp(spinner);
    spinner.succeed(success(spinner.elapsedTime));

    return response;
  }
  catch (err: any) {
    spinner.failed(fail(err));

    throw err;
  }
}
