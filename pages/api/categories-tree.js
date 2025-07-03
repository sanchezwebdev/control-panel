// API route to fetch categories as a nested tree structure from the database.
import { pool } from "../../lib/db_connection";

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const dbConnection = pool;

    const [rows] = await dbConnection.execute('SELECT id, name, parent_id FROM categories');
    

    const categoryMap = {};
    const rootCategories = [];

    rows.forEach(row => {
      categoryMap[row.id] = { ...row, children: [] };
    });

    rows.forEach(row => {
      if (row.parent_id) {
        if (categoryMap[row.parent_id]) {
          categoryMap[row.parent_id].children.push(categoryMap[row.id]);
        }
      } else {
        rootCategories.push(categoryMap[row.id]);
      }
    });
    res.status(200).json({ success: true, categories: rootCategories });
  } catch (error) {
    console.error('Error fetching category tree:', error);
    res.status(500).json({ success: false, message: 'Database error' });
  }
}