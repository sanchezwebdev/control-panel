import { pool } from "../../lib/db_connection";

export default async function handler(req, res) {
  const { postId } = req.query;

  if (!postId) {
    return res.status(400).json({ success: false, message: 'Missing postId parameter' });
  }

  try {
    const dbConnection = pool;
    const [rows] = await dbConnection.execute(
      `
      SELECT c.id, c.name, c.parent_id
      FROM categories c
      INNER JOIN post_categories pc ON pc.category_id = c.id
      WHERE pc.post_id = ?
      `,
      [postId]
    );

        
    res.status(200).json({ success: true, categories: rows });
  } catch (error) {
    console.error('Error fetching categories for post:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}
