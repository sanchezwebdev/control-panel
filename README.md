# Knowledge Base Control Panel

## Overview

This Next.js application serves as an admin panel with CRUD functionality for posts or entries. It supports authentication, category management, and dynamic content editing through various UI pages and backend API routes.

---

## Project Structure and Flow

### 1. **Pages (`pages/`)**

* **`_app.jsx`**
  The root app component that wraps all pages, used to set up global providers or layouts.

* **API routes (`pages/api/`)**
  These JavaScript files implement serverless API endpoints handling backend operations such as:

  * Authentication: `login.js`, `logout.js`
  * CRUD actions on entries/posts: `create-post.js`, `update-post.js`, `delete-entry.js`, `find-post.js`
  * Data fetching helpers: `get-categories.js`, `get-categories-for-post.js`, `categories-tree.js`, `periods.js`
  * Image handling: `images/[filename].js` (dynamic API for image assets)

* **Page routes**
  Each folder under `pages/` with an `index.jsx` file corresponds to a UI route in the app:

  * `/create-entry` → Form to create a new entry
  * `/delete-entry` → Interface for deleting an entry
  * `/update-entry` → Form for updating existing entries
  * `/login` → User login page
  * `/index.jsx` → The main landing or dashboard page

---

### 2. **Components (`components/`)**

Reusable React components used across pages:

* **`Layout.jsx`**
  Main layout wrapper providing consistent UI structure (header, nav) around pages.
* **`Navbar.jsx`**
  Navigation bar displayed within the layout.
* **`CategorySelector.jsx`**
  UI component to select categories, used in create and update forms.
* **Templates (`templates/`)**

  * `Article.jsx` and `RichText.jsx` — Components for rendering rich text editor and article views.

---

### 3. **Context (`context/`)**

* **`SelectionContext.js`**
  React Context API implementation for managing global selection state shared across components and pages.

---

### 4. **Libraries (`lib/`)**

Utility scripts supporting core app functions:

* **`db_connection.js`**
  Establishes database connection (MySQL) using environment variables from `.env`.
* **`auth.js`**
  Handles authentication logic (token verification, session management).
* **`fetch_data.js` and `fetch_filters.js`**
  Functions to fetch data or filtering options from backend API routes.
* **`periods.js`**
  Fetches time period data from the database for update and create page period selectors.

---

### 5. **Styles (`styles/`)**

CSS modules and global styles scoped to components or pages, for example:

* `Layout.module.css` for `Layout.jsx`
* `Navbar.module.css` for `Navbar.jsx`
* Specific styles for pages like Create, Delete, Update, and Article rendering.

---

## Environment Variables (`.env`)

The `.env` file contains critical configuration parameters such as database connection credentials and API keys. These are consumed by backend utilities (`lib/db_connection.js`) and authentication modules.
---

## Local Development

1. Clone the repository
2. Run `npm install` to install dependencies
3. Create a `.env` file with required variables 
4. Start the development server with `npm run dev`
5. Access the app at `http://localhost:3000`
---

## Deployment

The project is designed for deployment on **Vercel**. Key steps:

* Ensure environment variables are configured in Vercel’s dashboard
* Deploy using the Vercel CLI or Git integration (`vercel` command)
* Vercel handles serverless API routes and frontend hosting seamlessly
---

## Summary

* The **`pages/`** folder contains frontend pages and API backend routes.
* The **`components/`** folder houses reusable UI components including the core `Layout`.
* **`context/`** provides global state management.
* **`lib/`** includes backend utilities like database connection and auth.
* The `.env` file configures sensitive credentials used throughout the app.
* The app runs locally via `npm run dev` and deploys easily to Vercel.
---
