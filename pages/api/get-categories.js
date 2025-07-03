import { pool } from "../../lib/db_connection";

export default async function handler(req, res) {
  try {
    const dbConnection = pool;

    const [rows] = await dbConnection.execute('SELECT id, name FROM categories ORDER BY name ASC');
    

    res.status(200).json({ success: true, categories: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch categories' });
  }
}
