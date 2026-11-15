// Modèle métier indépendant de Next.js, React et PostgreSQL.
export interface Idea {
  id: string;
  date: string;
  dateRaw: string;
  firstName: string;
  lastName: string;
  direction: string;
  site: string;
  theme: string;
  title: string;
  description: string;
  benefits: string;
  budgetRaw: string;
  budget: number | null;
  warnings: string[];
}
export class ImportError extends Error {}
