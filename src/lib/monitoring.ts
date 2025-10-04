export function captureException(error: Error, info?: unknown) {
  console.error("Monitoring capture", error, info);
}
