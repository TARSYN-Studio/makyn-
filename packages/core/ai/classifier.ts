export type NoticeClassification = unknown;
export async function classifyNotice(
  _extraction: unknown,
  _rawText: string,
  _companies: unknown[]
): Promise<NoticeClassification> {
  throw new Error("classifier not yet implemented — Part 3");
}
