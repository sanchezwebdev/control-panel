
import pool from "./db_connection.js";

export default async function fetchData(req, res) {
  try {
    const db = pool;
    const [rows] = await db.execute('SELECT ID, period_name FROM periods');    
    res.status(200).json({ success: true, periods: rows });
  } catch (error) {
    console.error('Error fetching periods:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
}
