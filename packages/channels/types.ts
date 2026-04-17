export type ChannelKind = "TELEGRAM" | "WHATSAPP" | "EMAIL" | "SMS";

export type InboundChannelMessage = {
  kind: ChannelKind;
  externalUserId: string;
  externalUsername?: string | null;
  rawText?: string | null;
  extractedText?: string | null;
  attachmentKind?: "photo" | "document" | "voice" | null;
  attachmentLocalPath?: string | null;
  receivedAt: Date;
};

export type OutboundChannelMessage = {
  kind: ChannelKind;
  externalUserId: string;
  text: string;
  inlineKeyboard?: Array<Array<{ label: string; value: string }>>;
};

export interface ChannelAdapter {
  kind: ChannelKind;
  send(message: OutboundChannelMessage): Promise<void>;
}
