import 'dotenv/config';
import { pool } from "../../lib/db_connection";

export default async function handler(req, res) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { slug } = req.body;  
  console.log('SLUG', slug);
  
  if (!slug) {
    return res.status(400).json({ success: false, message: 'Slug is required' });
  }
  
  try {
    const dbConnection = pool;

    // Fetch post content to extract image references before deletion
    const [rows] = await dbConnection.execute(
      'SELECT post_content FROM posts WHERE post_name = ?',
      [slug.toLowerCase()]
    );

    console.log("ROWS", rows);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const postContent = rows[0].post_content;

    // Helper: extract local image filenames from HTML content
    const extractLocalImageFilenames = (html) => {
      if (!html) return [];
      const imgMatches = Array.from(html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/g));
      const filenames = [];

      for (const match of imgMatches) {
        const src = match[1];
        if (process.env.BASE_URL && src.startsWith(process.env.BASE_URL)) {
          const urlParts = src.split('/');
          const filename = urlParts[urlParts.length - 1];
          if (filename && !filenames.includes(filename)) {
            filenames.push(filename);
          }
        }
      }
      return filenames;
    };

    const imageFilenames = extractLocalImageFilenames(postContent);

    // Delete the post from the database
    const [deleteResult] = await dbConnection.execute(
      'DELETE FROM posts WHERE post_name = ?',
      [slug.toLowerCase()]
    );

    if (deleteResult.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Post not found or already deleted' });
    }

    // Loop through and delete associated images by calling internal API
    let deletedImages = 0;
    let failedDeletions = 0;

    for (const filename of imageFilenames) {
      try {
        const deleteResponse = await fetch(process.env.BASE_URL + '/delete-image', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename }),
        });

        if (deleteResponse.ok) {
          deletedImages++;
        } else {
          const errorText = await deleteResponse.text();
          console.warn(`Failed to delete image: ${filename}`, errorText);
          failedDeletions++;
        }
      } catch (err) {
        console.warn(`Error deleting image: ${filename}`, err.message);
        failedDeletions++;
      }
    }

    // Build response summary
    const response = {
      success: true,
      message: 'Post deleted successfully',
      imagesSummary: {
        total: imageFilenames.length,
        deleted: deletedImages,
        failed: failedDeletions,
      },
    };

    if (process.env.NODE_ENV === 'development') {
      response.imagesFound = imageFilenames;
    }

    return res.status(200).json(response);
  } catch (err) {
    console.error('Error in delete-entry handler:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}
