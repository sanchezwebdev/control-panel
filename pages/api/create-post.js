import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { pool } from "../../lib/db_connection";

// Helper function to create an excerpt (plain text, limited words) from HTML
function getExcerpt(html, wordLimit = 50) {
  const plainText = html.replace(/<[^>]*>/g, "");
  const words = plainText.split(/\s+/).slice(0, wordLimit);
  return words.join(" ").trim();
}

// Allow larger request bodies (for large content or images)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Extract required fields from request body
  const { title, content, categoryIds, links = [], period } = req.body;

  if (!title || !content || !period) {
    return res
      .status(400)
      .json({ success: false, message: "Missing required fields" });
  }

  try {
    const dbConnection = pool;
    let html = content;

    // Find base64 images in the content and save them to disk
    const base64Matches = [
      ...html.matchAll(
        /<img[^>]+src=["'](data:image\/[^;]+;base64,[^"']+)["'][^>]*>/g
      ),
    ];

    for (const match of base64Matches) {
      const base64Match = match[1];
      const mimeMatch = base64Match.match(/^data:(.+);base64,(.+)$/);
      if (!mimeMatch) continue;

      const mimeType = mimeMatch[1];
      const base64 = mimeMatch[2];
      const ext = mimeType.split("/")[1];
      const filename = `image-${Date.now()}-${Math.floor(Math.random() * 10000)}.${ext}`;

      // Save image to /public/images
      const buffer = Buffer.from(base64, "base64");
      const imagesDir = path.join(process.cwd(), "public", "images");

      if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir, { recursive: true });
      }

      const filePath = path.join(imagesDir, filename);
      fs.writeFileSync(filePath, buffer);

      const finalUrl = `/images/${filename}`;
      html = html.replace(`src="${base64Match}"`, `src="${finalUrl}"`)
                 .replace(`src='${base64Match}'`, `src='${finalUrl}'`);
    }

    // Generate slug and excerpt
    const slug = title
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]/g, "");

    const excerpt = getExcerpt(html, 50);

    // Insert main post data
    const [result] = await dbConnection.execute(
      "INSERT INTO posts (post_name, post_title, post_content, post_excerpt, to_ping, pinged, post_content_filtered) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [slug, title, html, excerpt, "", "", ""]
    );

    const insertId = result.insertId;

    // Insert post-category relationships
    const uniqueCategoryIds = [...new Set(categoryIds)];
    if (uniqueCategoryIds.length > 0) {
      const values = uniqueCategoryIds.map((catId) => [insertId, catId]);
      await dbConnection.query(
        "INSERT INTO post_categories (post_id, category_id) VALUES ?",
        [values]
      );
    }

    // Insert related links
    for (const linkUrl of links) {
      await dbConnection.execute(
        `INSERT INTO links (link_url, link_notes, link_owner) VALUES (?, '', ?)`,
        [linkUrl, insertId]
      );
    }

    // Insert post-period relationship
    await dbConnection.execute(
      `INSERT INTO post_periods (post_id, period_id) VALUES (?, ?)`,
      [insertId, period]
    );

    res.status(200).json({ success: true, slug });
  } catch (err) {
    console.error("Error in create-post handler:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}
