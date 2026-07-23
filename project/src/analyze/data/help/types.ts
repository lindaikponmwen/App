export interface GlossaryItem {
  term: string;
  definition: string;
  category: string;
}

export interface Snippet {
  id: string;
  language: string;
  title: string;
  description: string;
  code: string;
}