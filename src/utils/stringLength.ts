// Import Node.js Dependencies
import {
  stripVTControlCharacters
} from "node:util";

// CONSTANTS
const kLenSegmenter = new Intl.Segmenter();

export function stringLength(
  string: string
): number {
  if (string === "") {
    return 0;
  }

  let length = 0;
  for (const _ of kLenSegmenter.segment(
    stripVTControlCharacters(string)
  )) {
    length++;
  }

  return length;
}
