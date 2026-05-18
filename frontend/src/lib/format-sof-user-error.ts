import { parseApiErr } from "@/lib/parse-api-error";

/** Map API / validation text to clearer messages for SOF event and laytime actions. */
export function formatSofUserError(e: unknown): string {
  const raw = parseApiErr(e);
  const lower = raw.toLowerCase();

  if (lower.includes("overlap") || lower.includes("overlapping")) {
    return "This time range overlaps another event on the SOF. Load all events (More events), check the red gap rows, and adjust start/end times so periods do not overlap.";
  }
  if (lower.includes("before start") || lower.includes("start time must be before")) {
    return "The start time must be earlier than the end time.";
  }
  if (lower.includes("invalid") && lower.includes("time")) {
    return "One of the date/time values is not valid. Check start and end times.";
  }
  if (lower.includes("closed") && lower.includes("sof")) {
    return "This SOF is closed — events and laytime cannot be changed.";
  }
  if (lower.includes("must be signed in")) {
    return "You must be signed in to record events.";
  }
  if (lower.includes("event type")) {
    return raw;
  }

  return raw;
}
