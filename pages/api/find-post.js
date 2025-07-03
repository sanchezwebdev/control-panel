import { pool } from "../../lib/db_connection";
import createDOMPurify from "dompurify";
import { JSDOM } from "jsdom";

export default async function handler(req, res) {
  // Only allow POST method
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const { searchType, searchTerm } = req.body;  

  // Validate request payload
  if (!searchType || !searchTerm) {
    return res.status(400).json({
      success: false,
      message: "Search type and search term are required",
    });
  }

  try {
    const dbConnection = pool;

    let query;
    let params;

    // Build SQL query based on search type (by ID or by title)
    if (searchType === "id") {
      query = "SELECT id, post_title, post_content FROM posts WHERE id = ?";
      params = [searchTerm];
    } else if (searchType === "title") {
      query =
        "SELECT id, post_title, post_content FROM posts WHERE post_title LIKE ?";
      params = [`%${searchTerm}%`];
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid search type. Use "id" or "title".',
      });
    }

    // Execute main post query
    const [rows] = await dbConnection.execute(query, params);
    const post = rows[0];    

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No posts found matching your search criteria",
      });
    }

    // Fetch related links
    const [linksRows] = await dbConnection.execute(
      "SELECT link_url FROM links WHERE link_owner = ?",
      [post.id]
    );

    // Fetch associated categories
    const [categoryRows] = await dbConnection.execute(
      "SELECT category_id FROM post_categories WHERE post_id = ?",
      [post.id]
    );

    // Fetch associated period
    const [period] = await dbConnection.execute(
      "SELECT period_id FROM post_periods WHERE post_id = ?",
      [post.id]
    );

    // Sanitize HTML fields to avoid XSS when returning content
    const window = new JSDOM("").window;
    const DOMPurify = createDOMPurify(window);
    const cleanContent = DOMPurify.sanitize(post.post_content);
    const cleanTitle = DOMPurify.sanitize(post.post_title);

    // Return full post data with related links and categories
    return res.status(200).json({
      success: true,
      id: post.id,
      title: cleanTitle,
      content: cleanContent,
      totalMatches: rows.length,
      links: linksRows.map((row) => row.link_url),
      categoryIds: categoryRows.map((row) => row.category_id),
      period: period[0].period_id
    });
  } catch (err) {
    console.error("Error in find-post handler:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}
