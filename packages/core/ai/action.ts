export type NoticeAction = unknown;
export async function generateAction(
  _extraction: unknown,
  _classification: unknown,
  _user: unknown
): Promise<NoticeAction> {
  throw new Error("action generator not yet implemented — Part 3");
}
