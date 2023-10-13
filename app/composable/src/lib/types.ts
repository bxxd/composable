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
  total_embedding_distance?: number; // cumulative embedding distance
  count_embeddings?: number; // count of excerpts with embedding distance
}

export type RoleType = "assistant" | "data" | "user";

/* below is description of the data structure in the Editor */
interface TextContent {
  text: string;
  type: string;
}

interface HardBreak {
  type: string;
}

interface ParagraphContent {
  type: string;
  content: (TextContent | HardBreak)[];
}

interface DocumentBlockAttrs {
  role: "system" | "user" | "assistant";
  data: null | {
    tags?: string[];
    title?: string | null;
    tokens?: any;
    excerpt?: string | null;
    insight?: any;
    category?: any;
    subcategory?: any;
  };
  id: string;
  children?: DocumentBlock[];
}

export interface DocumentBlock {
  type: "dBlock";
  attrs: DocumentBlockAttrs;
  content?: ParagraphContent[];
}
