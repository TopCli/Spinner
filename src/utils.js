
export function cleanLineFeed(str) {
  return str.replaceAll(/\r?\n|\r/gm, "");
}

export function assertSpinnerFrame(frame) {
  if (!("frames" in frame)) {
    throw new Error("Spinner object must have a frames property");
  }
  if (!("interval" in frame)) {
    throw new Error("Spinner object must have an interval property");
  }

  return frame;
}
