// Import Third-party Dependencies
import { Spinner } from "cli-spinners";

export function cleanLineFeed(str: string): string {
  return str.replaceAll(/\r?\n|\r/gm, "");
}

export function assertSpinner(spinner: Spinner) {
  if (!("frames" in spinner)) {
    throw new Error("Spinner object must have a frames property");
  }
  if (!("interval" in spinner)) {
    throw new Error("Spinner object must have an interval property");
  }

  return spinner;
}
