export interface MailRewardItem {
  itemId: string;
  quantity: number;
  name?: string;
}

export interface MailPayload {
  items: MailRewardItem[];
  coins: number;
  gems: number;
  exp: number;
}

export interface MailMessageView {
  id: string;
  subject: string;
  body: string | null;
  mailType: string;
  payload: MailPayload;
  isRead: boolean;
  isClaimed: boolean;
  createdAt: string;
}
