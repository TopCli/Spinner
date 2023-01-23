/// <reference types="@types/node" />
/// <reference types="cli-spinners" />

import * as TTY from "tty";
import * as events from "events";
import cliSpinners from "cli-spinners";

interface ISpinnerOptions {
  /**
   * Spinner object or spinner name (from cli-spinners lib)
   *
   * @default "dots"
   */
  spinner?: cliSpinners.Spinner | cliSpinners.SpinnerName;
  text?: string;
  prefix?: string;
  color?: string;
  verbose?: boolean;
}

declare class Spinner extends events.EventEmitter {
  static reset(): void;

  constructor(options?: ISpinnerOptions);

  public text: string;
  public stream: TTY.WriteStream;
  public readonly color: string;
  public readonly elapsedTime: number;
  public readonly startTime: number;
  public readonly started: boolean;

  get spinner(): cliSpinners.Spinner;
  set spinner(value: cliSpinners.Spinner | cliSpinners.SpinnerName);

  public start(text?: string): Spinner;
  public succeed(text?: string): Spinner;
  public failed(text?: string): Spinner;
}

export {
  Spinner,
  ISpinnerOptions
};
