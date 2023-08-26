export interface DataItem {
  id: number;
  title: string;
  category: string;
  subcategory: string;
  insight: string;
  excerpt: string;
  tags: string[];
  tokens: number;
}

export type RoleType = "assistant" | "data" | "user";
