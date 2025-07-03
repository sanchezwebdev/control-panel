// Utility function to fetch filtered and paginated post data from the database, including categories, author, and period info.
import { pool } from "./db_connection";

export async function fetchData({ category = "", author = "", title = "", period = "", limit = 25, offset = 0 } = {}) {
  try {
    const db = pool
    
    const limitInt = parseInt(limit) || 25;
    const offsetInt = parseInt(offset) || 0;
    
    const params = [];
    let whereClause = "WHERE 1=1";

    if (title) {
      whereClause += ` AND p.post_title LIKE ?`;
      params.push(`%${title}%`);
    }

    if (category) {
      whereClause += ` AND c.name = ?`;
      params.push(category);
    }

    if (author) {
      whereClause += ` AND u.display_name = ?`;
      params.push(author);
    }

    if (period) {
      whereClause += ` AND per.period_name = ?`;
      params.push(period);
    }
    
    const dataQuery = `
      SELECT
        p.ID, 
        p.post_title,
        p.post_content,
        u.display_name,
        GROUP_CONCAT(DISTINCT c.name ORDER BY c.name SEPARATOR ', ') AS categories,
        GROUP_CONCAT(DISTINCT per.period_name ORDER BY per.period_name SEPARATOR ', ') AS periods
      FROM posts p
      LEFT JOIN users u ON p.post_author = u.ID
      LEFT JOIN post_categories pc ON p.ID = pc.post_id
      LEFT JOIN categories c ON pc.category_id = c.id
      LEFT JOIN post_periods pp ON p.ID = pp.post_id
      LEFT JOIN kow_period per ON pp.period_id = per.ID
      ${whereClause}
      GROUP BY p.ID, p.post_title, p.post_content, u.display_name
      ORDER BY p.post_title ASC
      LIMIT ${limitInt} OFFSET ${offsetInt}
    `;

    const totalQuery = `
      SELECT COUNT(DISTINCT p.ID) AS total
      FROM posts p
      LEFT JOIN users u ON p.post_author = u.ID
      LEFT JOIN post_categories pc ON p.ID = pc.post_id
      LEFT JOIN categories c ON pc.category_id = c.id
      LEFT JOIN post_periods pp ON p.ID = pp.post_id
      LEFT JOIN kow_period per ON pp.period_id = per.ID
      ${whereClause}
    `;
    
    const [dataRows] = await db.execute(dataQuery, params);
    const [countRows] = await db.execute(totalQuery, params);

    return {
      rows: dataRows.map(row => ({
        id: row.ID,
        title: row.post_title,
        content: row.post_content,
        categories: row.categories ? row.categories.split(', ') : [],
        author: row.display_name || null,
        period: row.periods ? row.periods.split(', ') : [],
      })),
      totalCount: countRows[0]?.total || 0,
    };
  } catch (error) {
    console.error("Error in fetchData:", error);
    return { rows: [], totalCount: 0 };
  }
}