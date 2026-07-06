export interface Notice {
  id: string;
  title: string;
  content: string;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Banner {
  id: string;
  title: string;
  image_url: string;
  link_url: string | null;
  sort_order: number;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Pick {
  id: string;
  title: string;
  description: string | null;
  book_isbn: string | null;
  cover_image_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DictionaryEntry {
  id: string;
  term: string;
  definition: string;
  category: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  link_url: string | null;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type ReportStatus = 'pending' | 'resolved' | 'dismissed';

export interface Report {
  id: string;
  reporter_user_id: string;
  target_type: string;
  target_id: string;
  reason: string;
  description: string | null;
  status: ReportStatus;
  admin_note: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
  updated_at: string;
}

export type InquiryStatus = 'open' | 'answered' | 'closed';

export interface Inquiry {
  id: string;
  user_id: string;
  subject: string;
  content: string;
  status: InquiryStatus;
  admin_reply: string | null;
  replied_at: string | null;
  replied_by: string | null;
  created_at: string;
  updated_at: string;
}
