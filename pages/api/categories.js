// API route to handle CRUD operations (create, read, update, delete) for categories, including recursive deletion of subcategories.
import { pool } from "../../lib/db_connection";

export default async function handler(req, res) {
  const db = pool;
  const { name, parent_id } = req.body;  

  try {
    const { method } = req;

    if (method === "GET") {
      const [rows] = await db.execute("SELECT * FROM categories");
      return res.status(200).json(rows);
    } else if (method === "POST") {
      const { name, parent_id } = req.body;
      await db.execute("INSERT INTO categories (name, parent_id) VALUES (?, ?)", [name, parent_id || null]);
      return res.status(201).json({ message: "Category created" });
    } else if (method === "PUT") {
      const { id, name } = req.body;
      await db.execute("UPDATE categories SET name = ? WHERE id = ?", [name, id]);
      return res.status(200).json({ message: "Category updated" });
    } else if (method === "DELETE") {
      const { id } = req.body;
      
      async function deleteCategoryAndChildren(categoryId) {
        const [children] = await db.execute("SELECT id FROM categories WHERE parent_id = ?", [categoryId]);
        for (let child of children) {
          await deleteCategoryAndChildren(child.id);
        }
        await db.execute("DELETE FROM categories WHERE id = ?", [categoryId]);
      }

      await deleteCategoryAndChildren(id);
      return res.status(200).json({ message: "Category and subcategories deleted" });
    } else {
      return res.status(405).json({ message: "Method not allowed" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
}
