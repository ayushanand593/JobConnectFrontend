export interface DisclosureQuestion {
  id: number;
  questionText: string;
  questionType: 'TEXT' | 'BOOLEAN' | 'MULTIPLE_CHOICE';
  isRequired: boolean;
  options?: string[];
}