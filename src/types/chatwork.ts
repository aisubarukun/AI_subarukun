export type ChatworkWebhookPayload = {
  webhook_setting_id: string;
  webhook_event_type: string;
  webhook_event_time: number;
  webhook_event: {
    message_id: string;
    room_id: number;
    account_id: number;
    body: string;
    send_time: number;
    update_time: number;
  };
};
