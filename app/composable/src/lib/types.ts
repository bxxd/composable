// export interface DataItem {
//   id: number;
//   title: string;
//   category: string;
//   subcategory: string;
//   insight: string;
//   excerpt: string;
//   tags: string[];
//   tokens: number;
// }

export interface Excerpt {
  id: number;
  filing_id: number;
  title: string;
  category: string;
  subcategory: string;
  insight: string;
  excerpt: string;
  tokens: number;
  tags: string[];
  embedding_distance?: number | null;
}

export interface DataItem extends Excerpt {}

export interface Filing {
  filing_id: number;
  company_id: number;
  form_file: string;
  reporting_for: Date;
  filed_at: Date;
  filing_period: string;
  filing_type: string;
  url: string;
  created_at: Date;
  report_title: string;
  excerpts: Excerpt[];
}

export interface Company {
  company_id: number;
  company_name: string;
  company_ticker: string;
  filings: Record<number, Filing>;
}

export type RoleType = "assistant" | "data" | "user";
