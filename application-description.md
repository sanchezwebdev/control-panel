Great! To write tailored **About** content for your Django/PostgreSQL data analytics dashboard, I’ll need a few key pieces of information. Here's a checklist — you can copy/paste and fill in as much as you're ready to share:

---

### 🔹 General Info

1. **App Name** (if any): 
2. **Brief One-Liner** (how would you describe the app in 1 sentence?):
3. **What kind of users is this dashboard for?** (e.g., internal staff, clients, general public) 
4. **Main use case / problem it solves:** 

---

### 🔹 Technical Details

5. **Tech Stack** (you mentioned Django, PostgreSQL – anything else? Like JS framework, charting libs, Celery, Docker, etc.):
6. **Data Source(s)** – where is the data coming from? 
7. **Key Features / Modules** (e.g., filterable charts, user auth, export to CSV, scheduled reports): 
8. **Is it deployed live?** (if yes, include the URL or just say where it's hosted: Heroku, Vercel, etc.) 

---

### 🔹 Visuals / UX

9. **Design approach** (clean and minimal? themed? Bootstrap or Tailwind? Custom design?) 
10. **Any standout features or user interactions?** (e.g., drill-downs, animations, mobile-responsive layout) 

---

### 🔹 GitHub README-Specific

11. **Install instructions** — do you want these included? Do you have a `requirements.txt` or Dockerfile? 

---

### 🔹 Portfolio-Specific

12. **What do you want to emphasize in your portfolio?** (e.g., problem-solving, code architecture, business impact, UX decisions) 
13. **Any challenges or accomplishments you're proud of?** 
14. **Would you like a call-to-action at the end?** (e.g., “Contact me to learn more,” or “View the source code”) 

---

Once I have your answers, I’ll give you:

* ✅ A **popup modal version** (\~100–150 words, friendly but informative)
* ✅ A **README.md** (standard format, install/setup/use, features, screenshots section)
* ✅ A **portfolio writeup** (detailed, narrative-style, suited for a personal website with optional visual aids)


app title: Knowledge Of The West
brief one lines: you tell me
this project is meant for site administrators of a wikipedia-like site called knowledge of the west. it's meant to grant administrators full control over site content. 
main use case/problem solved: this essentially provides a layer of abstraction from the backedn mysql database so the administrator can edit entries which include the content itself and its categorization, links attached, timelines, and periods associated to the entry. it also allows the administrator to add edit and delete categories to categorize entries. 
tech stack: nextjs, jwt bcrypt for user logins and session management, react bootstrap, vercel
data: there are two versions of this application: the real version submitted to the client, and the prototype version for the portfolio. the prototype version holds data in mysql aiven and images are held in the repo in public/image. the real version uses a mysql database hosted in a windows VPS and images are handled with an Express.js server and store images in the windows file system. 
it's live and knowldegeadminpanel.gerardosanchez.dev
the design approach is clean and minimal with the use of bootstrap
standout features: the panel uses Rich Text Editor from richtexteditor.com to allow the user to create an article. in the edit page the user can switch between an html view so they can see how the article will appear in the site itself once it's rendered, and switch back to the editor so they can fully edit the article. it's important to note that the prototype version which again will be the version provided in the portfolio does not allow the user to make any real modifications although the user will receive confirmation modals that updates creations and deletions were completed successfully to mimic the use of the control panel. the reason for this should be obvious, the prototype is meant for demonstration purposes only and not inteneded for the public to go in and change anything they want from the database and file system. 

I will add a requirements.txt

the problem solving and code structure is fairly elaborate. for example the category editor is pretty nice as it updates options on the fly as the user selects top level categoris and subcategoreis, the selections are kept in state and when submitted the logic parses through the selections and organizes the API post request so the selctions are flattened and added to a pivot table. the image handling is also fairly intricate because richtexteditor saves images added in base64 so I had to design a system that extracts the base64 converts it and saves the image to the file system and then takes the address/location of the image and injects it back into the location the base64 came from to add the location to the src of the image markup tag. and also when images are deleted the logic will scan for removed images and find the location of that image and remove it from storage so as to avoid orphaned images. you can see some of that logic here import fs from "fs";
import path from "path";
import 'dotenv/config';
import { pool } from "../../lib/db_connection";

function getExcerpt(html, wordLimit = 50) {
  const plainText = html.replace(/<[^>]*>/g, "");
  const words = plainText.split(/\s+/).slice(0, wordLimit);
  return words.join(" ").trim();
}

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

    const [rows] = await dbConnection.execute(
      "SELECT post_content FROM posts WHERE post_name = ?",
      [slug]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    const previousContent = rows[0].post_content;

    const extractImagePaths = (html) => {
      return Array.from(html.matchAll(/<img[^>]+src=["'](\/images\/[^"']+)["']/g)).map((match) => match[1]);
    };

    const oldImages = extractImagePaths(previousContent);
    let html = content;

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

    const newImages = extractImagePaths(html);
    const deletedImages = oldImages.filter((img) => !newImages.includes(img));

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

    const newSlug = title.toLowerCase().replace(/['’‘‛`´]/g, "").replace(/\s+/g, "-");
    const excerpt = getExcerpt(html, 50);

    const [result] = await dbConnection.execute(
      "UPDATE posts SET post_title = ?, post_content = ?, post_name = ?, post_excerpt = ? WHERE post_name = ?",
      [title, html, newSlug, excerpt, slug]
    );

    const [postResult] = await dbConnection.execute(
      "SELECT id FROM posts WHERE post_name = ?",
      [newSlug]
    );

    if (postResult.length === 0) {
      return res.status(404).json({ success: false, message: "Post not found after update" });
    }

    const postId = postResult[0].id;

    await dbConnection.execute("DELETE FROM links WHERE link_owner = ?", [postId]);

    if (Array.isArray(hyperlinks) && hyperlinks.length > 0) {
      const hyperlinkValues = hyperlinks.map((href) => [href, "", postId]);
      await dbConnection.query(
        "INSERT INTO links (link_url, link_notes, link_owner) VALUES ?",
        [hyperlinkValues]
      );
    }

    await dbConnection.execute("DELETE FROM post_categories WHERE post_id = ?", [postId]);

    if (Array.isArray(categoryIds) && categoryIds.length > 0) {
      const insertValues = categoryIds.map((catId) => [postId, catId]);
      await dbConnection.query(
        "INSERT INTO post_categories (post_id, category_id) VALUES ?",
        [insertValues]
      );
    }

    await dbConnection.execute("UPDATE post_periods SET period_id = ? WHERE post_id = ?", [
      period, postId
    ]);

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
 I also added a system that automatically creates slugs out of titles and assignes paths with those slugs so as entries are added pages are automatically created out of those entreis. you can see some of that logic here as well 
 import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { pool } from "../../lib/db_connection";

function getExcerpt(html, wordLimit = 50) {
  const plainText = html.replace(/<[^>]*>/g, "");
  const words = plainText.split(/\s+/).slice(0, wordLimit);
  return words.join(" ").trim();
}

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

  const { title, content, categoryIds, links = [], period } = req.body;

  if (!title || !content || !period) {
    return res
      .status(400)
      .json({ success: false, message: "Missing required fields" });
  }

  try {
    const dbConnection = pool;

    let html = content;

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

    const slug = title
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]/g, "");

    const excerpt = getExcerpt(html, 50);

    const [result] = await dbConnection.execute(
      "INSERT INTO posts (post_name, post_title, post_content, post_excerpt, to_ping, pinged, post_content_filtered) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [slug, title, html, excerpt, "", "", ""]
    );

    const insertId = result.insertId;

    const uniqueCategoryIds = [...new Set(categoryIds)];
    if (uniqueCategoryIds.length > 0) {
      const values = uniqueCategoryIds.map((catId) => [insertId, catId]);
      await dbConnection.query(
        "INSERT INTO post_categories (post_id, category_id) VALUES ?",
        [values]
      );
    }

    for (const linkUrl of links) {
      await dbConnection.execute(
        `INSERT INTO links (link_url, link_notes, link_owner) VALUES (?, '', ?)`,
        [linkUrl, insertId]
      );
    }

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

---

Knowledge Of The West – Admin Panel
Knowledge Of The West is a wiki-style digital encyclopedia focused on historical, philosophical, and cultural content. I was tasked with building an administrative dashboard to enable site maintainers to manage its knowledge base—without ever touching the database directly.

The result is a full-featured, intuitive control panel with a clean UI, deep backend logic, and a focus on content structure, security, and maintainability.

🧭 Project Overview
At its core, this project is a layer of abstraction over a relational MySQL database. It empowers admins to create and organize encyclopedic entries while maintaining a flexible, nested category system, related periods, and hyperlink references.

The admin interface provides:

Rich-text editing with live preview

Category/period/hyperlink association

Image upload via base64 decoding and cleanup

Authenticated access with session persistence

It’s currently live and viewable at:
knowledgeadminpanel.gerardosanchez.dev

🔒 Authentication & Security
Users log in with email and password using a secure JWT-based system. Credentials are hashed with bcrypt, and token-based sessions are managed via HTTP-only cookies. The login flow uses serverless functions to securely authenticate against a MySQL users table.

This ensures secure access control for administrative actions.

📝 Rich Text Editing with Real Image Handling
Admins create or edit entries with a full-featured WYSIWYG editor. Behind the scenes:

Images pasted into the editor are initially base64 strings.

The app detects these, extracts them, decodes them, and saves them to the server’s image directory.

It then replaces the original base64 in the article HTML with the path to the stored image.

When an image is removed from the editor, the app detects orphaned images and removes them from storage.

This results in clean markup and avoids filesystem bloat.

Admins can also toggle between the visual editor and raw HTML preview, ensuring fidelity with the published frontend display.

🧭 Dynamic Category Selection
The multi-level Category Selector is a key UX feature. It pulls a tree of nested categories from the database and lets users drill down in a breadcrumb-like fashion. As they select each category level, the component:

Updates its state path

Flattens the hierarchy

Sends a correctly structured array to the backend for relational table updates

All of this happens reactively—without page reloads or redundant queries.

🧠 Intelligent Content Creation
When creating a new post, the app:

Automatically generates a slug from the title (used for page routes)

Generates a clean excerpt by stripping and truncating the HTML

Creates associations with selected categories, hyperlinks, and historical periods

Handles insertion into multiple relational tables in a single backend handler

Everything is abstracted away from the admin—they just enter the data, and the logic takes care of the rest.

⚠️ Controlled Prototype Behavior
This portfolio version simulates full CRUD behavior through confirmation modals and UI updates, but no real mutations occur. This is intentional—to allow safe public access while showcasing the app’s logic, flow, and interface.

The real production version uses a Windows VPS for hosting, direct MySQL storage, and an Express backend for handling image uploads and deletions on the file system.

🧩 Stack Overview
Frontend: Next.js, React, Bootstrap, RichTextEditor

Backend: MySQL (Aiven), Serverless API Handlers

Authentication: JWT, bcrypt, secure cookies

Deployment: Vercel

🚧 Development Challenges
Designing a category system that supported deeply nested relationships and dynamic UI reflection

Managing base64 images in the editor and ensuring clean server-side handling

Parsing and updating HTML content on the fly while preserving formatting and metadata

Creating a seamless experience between writing/editing content and backend synchronization

🔍 Explore the App
👉 Live Site
👉 View Source Code