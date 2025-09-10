export interface Translation {
  id: number;
  entity_type: 'course' | 'problem' | 'document';
  entity_id: number;
  language: string;
  field: string;
  translated_text: string;
  created_at: string;
  updated_at?: string | null;
}
