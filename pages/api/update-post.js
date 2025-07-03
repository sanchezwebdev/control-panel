import fs from "fs";
import path from "path";
import 'dotenv/config';
import { pool } from "../../lib/db_connection";

// Get plain-text excerpt from HTML content
function getExcerpt(html, wordLimit = 50) {
  const plainText = html.replace(/<[^>]*>/g, "");
  const words = plainText.split(/\s+/).slice(0, wordLimit);
  return words.join(" ").trim();
}

// Increase allowed request body size for large content
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const { slug, content, title, categoryIds, hyperlinks, period } = req.body;
  if (!slug || !content)
    return res.status(400).json({ success: false, message: 'Slug and content are required' });

  try {
    const dbConnection = pool;

    // Retrieve existing post content by slug
    const [rows] = await dbConnection.execute(
      "SELECT post_content FROM posts WHERE post_name = ?",
      [slug]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    const previousContent = rows[0].post_content;

    // Extract image src paths
    const extractImagePaths = (html) => {
      return Array.from(html.matchAll(/<img[^>]+src=["'](\/images\/[^"']+)["']/g)).map((match) => match[1]);
    };

    const oldImages = extractImagePaths(previousContent);
    let html = content;

    // Find base64-encoded images embedded in HTML content
    const base64Matches = [
      ...html.matchAll(
        /<img[^>]+src=["'](data:image\/[^;]+;base64,[^"']+)["'][^>]*>/g
      ),
    ];

    // Decode and save base64 images as files, replace src with new URL
    for (const match of base64Matches) {
      const base64Match = match[1];
      const mimeMatch = base64Match.match(/^data:(.+);base64,(.+)$/);
      if (!mimeMatch) continue;

      const mimeType = mimeMatch[1];
      const base64 = mimeMatch[2];
      const ext = mimeType.split("/")[1];
      const filename = `image-${Date.now()}-${Math.floor(Math.random() * 10000)}.${ext}`;

      const buffer = Buffer.from(base64, "base64");
      const imagesDir = path.join(process.cwd(), "public", "images");

      if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir, { recursive: true });
      }

      const filePath = path.join(imagesDir, filename);
      fs.writeFileSync(filePath, buffer);

      const finalUrl = `/images/${filename}`;
      // Replace base64 src with new file URL
      html = html.replace(`src="${base64Match}"`, `src="${finalUrl}"`)
                 .replace(`src='${base64Match}'`, `src='${finalUrl}'`);
    }

    // Extract images from new content and find which old images were removed
    const newImages = extractImagePaths(html);
    const deletedImages = oldImages.filter((img) => !newImages.includes(img));

    // Delete images no longer referenced in content from filesystem
    for (const imgUrl of deletedImages) {
      try {
        const filename = path.basename(imgUrl);
        const localPath = path.join(process.cwd(), "public", "images", filename);
        if (fs.existsSync(localPath)) {
          fs.unlinkSync(localPath);
          console.log(`Deleted unused image: ${filename}`);
        }
      } catch (err) {
        console.warn(`Error deleting image: ${imgUrl}`, err.message);
      }
    }

    // Create new slug
    const newSlug = title.toLowerCase().replace(/['’‘‛`´]/g, "").replace(/\s+/g, "-");
    const excerpt = getExcerpt(html, 50);

    // Update record with new data
    const [result] = await dbConnection.execute(
      "UPDATE posts SET post_title = ?, post_content = ?, post_name = ?, post_excerpt = ? WHERE post_name = ?",
      [title, html, newSlug, excerpt, slug]
    );

    // Get post ID for relational updates
    const [postResult] = await dbConnection.execute(
      "SELECT id FROM posts WHERE post_name = ?",
      [newSlug]
    );

    if (postResult.length === 0) {
      return res.status(404).json({ success: false, message: "Post not found after update" });
    }

    const postId = postResult[0].id;

    // Remove old links and insert updated links
    await dbConnection.execute("DELETE FROM links WHERE link_owner = ?", [postId]);
    if (Array.isArray(hyperlinks) && hyperlinks.length > 0) {
      const hyperlinkValues = hyperlinks.map((href) => [href, "", postId]);
      await dbConnection.query(
        "INSERT INTO links (link_url, link_notes, link_owner) VALUES ?",
        [hyperlinkValues]
      );
    }

    // Remove old category associations and insert new ones
    await dbConnection.execute("DELETE FROM post_categories WHERE post_id = ?", [postId]);
    if (Array.isArray(categoryIds) && categoryIds.length > 0) {
      const insertValues = categoryIds.map((catId) => [postId, catId]);
      await dbConnection.query(
        "INSERT INTO post_categories (post_id, category_id) VALUES ?",
        [insertValues]
      );
    }

    // Update post period association
    await dbConnection.execute("UPDATE post_periods SET period_id = ? WHERE post_id = ?", [
      period, postId
    ]);

    // Respond with success 
    if (result.affectedRows > 0) {
      return res.status(200).json({ success: true });
    } else {
      return res.status(404).json({ success: false, message: "Post not found" });
    }
  } catch (err) {
    console.error("Error in update-post handler:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}
