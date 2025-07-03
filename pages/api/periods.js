import { pool } from "../../lib/db_connection";

export default async function handler(req, res) {
  try {
    const db = pool;
    const [rows] = await db.execute('SELECT ID, period_name FROM kow_period');  
    res.status(200).json({ success: true, periods: rows });
  } catch (error) {
    console.error('Error fetching periods:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
}
