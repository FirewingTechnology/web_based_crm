export interface WhatsAppTemplate {
  key: string;
  title: string;
  description: string;
  category: string;
  raw_template: string;
  rendered_body: string;
}

export interface WhatsAppMessage {
  id: number;
  lead_id: number;
  sender_id: number;
  sender_name?: string;
  template_key?: string;
  recipient_phone: string;
  recipient_name?: string;
  message_body: string;
  status: 'SENT' | 'DELIVERED' | 'READ' | 'REPLIED';
  sent_at: string;
  delivered_at?: string;
  read_at?: string;
  replied_at?: string;
  metadata_json?: string;
  wa_link?: string;
}

export interface WhatsAppSendMessagePayload {
  lead_id: number;
  template_key?: string;
  recipient_phone: string;
  message_body: string;
  metadata?: Record<string, any>;
}
