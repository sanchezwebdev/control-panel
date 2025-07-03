// Utility function to fetch distinct filter options (categories, authors, periods) from the database.
import { pool } from "./db_connection.js";

export async function fetchFilterOptions() {
  const db = pool;

  const [categories] = await db.execute(`SELECT DISTINCT name FROM categories ORDER BY name`);
  const [authors] = await db.execute(`SELECT DISTINCT display_name FROM users ORDER BY display_name`);
  const [periods] = await db.execute(`SELECT DISTINCT period_name FROM kow_period ORDER BY period_name`);


  return {
    categories: categories.map(c => c.name),
    authors: authors.map(a => a.display_name),
    periods: periods.map(p => p.period_name),
  };
}
