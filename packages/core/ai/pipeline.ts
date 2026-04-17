export type ProcessedNotice = unknown;
export async function processNotice(
  _rawText: string,
  _companies: unknown[],
  _user: unknown
): Promise<ProcessedNotice> {
  throw new Error("pipeline not yet implemented — Part 3");
}
