export type SearchDocumentKind = "Writing" | "Page" | "Painting" | "Project";

export interface SearchDocument {
  id: string;
  title: string;
  description?: string | null;
  href: string;
  kind: SearchDocumentKind;
}
