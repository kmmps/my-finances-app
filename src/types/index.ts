export type TagColor =
  | 'blue' | 'purple' | 'green' | 'yellow'
  | 'pink' | 'red' | 'orange' | 'teal' | 'indigo' | 'gray';

export interface Tag {
  id: string;
  name: string;
  color: TagColor;
  emoji: string;
}

export interface Attachment {
  id: string;
  name: string;
  mimeType: string;
  data: string; // base64 data URL
  size: number;
}

export interface BoletoData {
  pixCode: string;
  file: Attachment | null;
}

export interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDay: number;
  tagIds: string[];
  isPaid: boolean;
  isAutoDebit: boolean;
  boleto: BoletoData;
  comprovantes: Attachment[];
  note: string;
}

export interface Income {
  id: string;
  name: string;
  amount: number;
  type: 'base' | 'extra';
}

export interface MonthData {
  bills: Bill[];
  incomes: Income[];
}

export interface AppState {
  tags: Tag[];
  months: Record<string, MonthData>;
}

export type FilterType = 'all' | 'pending' | 'paid' | 'auto-debit';

export type AttachTab = 'boleto' | 'comprovante';

export type ModalType =
  | { kind: 'none' }
  | { kind: 'bill'; bill: Bill | null }
  | { kind: 'income'; income: Income | null }
  | { kind: 'tags' }
  | { kind: 'settings' }
  | { kind: 'attachments'; bill: Bill; tab: AttachTab };
