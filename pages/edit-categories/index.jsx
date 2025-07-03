import * as cookie from 'cookie';
import { verifyToken } from '../../lib/auth';
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import styles from "../../styles/Categories.module.css";

const CategoryEditor = () => {
  // State variables for categories, inputs, edit/delete IDs, modal and submission states
  const [categories, setCategories] = useState([]);
  const [topLevelName, setTopLevelName] = useState("");
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState(null);
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [deleteId, setDeleteId] = useState(null);
  const [modalMessage, setModalMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();

  // Fetch categories on component mount
  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then(setCategories);
  }, []);

  // Auto-hide modal 
  useEffect(() => {
    if (showModal) {
      const timeout = setTimeout(() => setShowModal(false), 4000);
      return () => clearTimeout(timeout);
    }
  }, [showModal]);

  // Show modal messages based on operation and status
  const showResultModal = (operation, statusKey) => {
    const messages = {
      create: {
        success: "Category created successfully.",
        error: "Failed to create category.",
        duplicate: "A top-level category with this name already exists.",
      },
      subcategory: {
        success: "Subcategory created successfully.",
        depthError: "Cannot add subcategory beyond 5 levels deep.",
        duplicate: "A category with this name already exists.",
        noParentSelected: "Please select a parent category before creating a subcategory.",
        error: "Failed to create subcategory.",
        tooShort: "Subcategory name must be at least 2 characters.",
      },
      update: {
        success: "Category updated successfully.",
        error: "Failed to update category.",
      },
      delete: {
        success: "Category deleted successfully.",
        error: "Failed to delete category.",
      },
    };

    const message = messages?.[operation]?.[statusKey];
    if (message) {
      setModalMessage(message);
      setShowModal(true);
    } else {
      console.warn(`Missing modal message for: ${operation} - ${statusKey}`);
    }
  };

  // Recursively calculate the depth of a category in the hierarchy
  const getCategoryDepth = (categoryId, allCategories, depth = 0) => {
    const parent = allCategories.find(c => c.id === parseInt(categoryId))?.parent_id;
    if (parent === null || parent === undefined) return depth;
    return getCategoryDepth(parent, allCategories, depth + 1);
  };

  // Handle creation of new category or subcategory 
  const handleCreate = async () => {
    const isSubcategory = !!parentId;
    const inputName = isSubcategory ? name.trim() : topLevelName.trim();

    if (!isSubcategory && inputName === "") {
      showResultModal("create", "error");
      return;
    }

    if (isSubcategory && (!parentId || inputName === "")) {
      showResultModal("subcategory", "noParentSelected");
      return;
    }

    if (inputName.length < 2) {
      showResultModal(isSubcategory ? "subcategory" : "create", "tooShort");
      return;
    }

    const nameExists = categories.some(cat => cat.name.trim().toLowerCase() === inputName.toLowerCase());
    if (nameExists) {
      showResultModal(isSubcategory ? "subcategory" : "create", "duplicate");
      return;
    }

    if (isSubcategory) {
      const depth = getCategoryDepth(parentId, categories);
      if (depth >= 4) {
        showResultModal("subcategory", "depthError");
        return;
      }
    }

    setIsSubmitting(true);

    // 🚫 The real API call is commented out to prevent actual changes.
    // try {
    //   const res = await fetch("/api/categories", {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify({ name: inputName, parent_id: parentId }),
    //   });

    //   showResultModal(isSubcategory ? "subcategory" : "create", res.ok ? "success" : "error");

    //   if (res.ok) {
    //     setTimeout(() => router.reload(), 4000);
    //   }
    // } catch (err) {
    //   console.error("Create error:", err);
    //   showResultModal(isSubcategory ? "subcategory" : "create", "error");
    // } finally {
    //   setIsSubmitting(false);
    // }

    // ✅ Simulate success instead:
    showResultModal(isSubcategory ? "subcategory" : "create", "success");
    setIsSubmitting(false);
  };

  const handleUpdate = async () => {
    if (!editId || editName.trim().length < 2) {
      showResultModal("update", "error");
      return;
    }

    setIsSubmitting(true);

    // 🚫 The real API call is commented out to prevent actual updates.
    // try {
    //   const res = await fetch("/api/categories", {
    //     method: "PUT",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify({ id: editId, name: editName.trim() }),
    //   });

    //   showResultModal("update", res.ok ? "success" : "error");
    //   if (res.ok) {
    //     setTimeout(() => router.reload(), 4000);
    //   }
    // } catch (err) {
    //   console.error("Update error:", err);
    //   showResultModal("update", "error");
    // } finally {
    //   setIsSubmitting(false);
    // }

    // ✅ Simulate success instead:
    showResultModal("update", "success");
    setIsSubmitting(false);
  };

  const handleDelete = async () => {
    setShowConfirmModal(false);
    setIsSubmitting(true);

    // 🚫 The real API call is commented out to prevent actual deletions.
    // try {
    //   const res = await fetch("/api/categories", {
    //     method: "DELETE",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify({ id: deleteId }),
    //   });

    //   showResultModal("delete", res.ok ? "success" : "error");
    //   if (res.ok) {
    //     setTimeout(() => router.reload(), 4000);
    //   }
    // } catch (err) {
    //   console.error("Delete error:", err);
    //   showResultModal("delete", "error");
    // } finally {
    //   setIsSubmitting(false);
    // }

    // ✅ Simulate success instead:
    showResultModal("delete", "success");
    setIsSubmitting(false);
  };

  return (
    <div className={styles.container}>
      <Layout>
        <h1 className={styles.header}>Categories Manager</h1>

        {/* Create Top-Level */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Create Top-Level Category</h2>
          <input
            className={styles.input}
            placeholder="Category Name"
            value={topLevelName}
            onChange={(e) => setTopLevelName(e.target.value)}
          />
          <button
            className={styles.button}
            onClick={handleCreate}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Create Top-Level Category"}
          </button>
        </section>

        {/* Create Subcategory */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Create Subcategory</h2>
          <input
            className={styles.input}
            placeholder="Subcategory Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <select
            className={styles.select}
            value={parentId || ""}
            onChange={(e) => setParentId(e.target.value || null)}
          >
            <option value="">-- Select Parent Category --</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <button
            className={styles.button}
            onClick={handleCreate}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Create Subcategory"}
          </button>
        </section>

        {/* Edit Category */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Edit Category Name</h2>
          <select
            className={styles.select}
            onChange={(e) => setEditId(e.target.value)}
          >
            <option>Select a category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <input
            className={styles.input}
            placeholder="New name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
          />
          <button
            className={styles.button}
            onClick={handleUpdate}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Update"}
          </button>
        </section>

        {/* Delete Category */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Delete Category</h2>
          <select
            className={styles.select}
            onChange={(e) => setDeleteId(e.target.value)}
          >
            <option>Select one to delete</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <button
            className={styles.deleteButton}
            onClick={() => {
              if (deleteId) setShowConfirmModal(true);
            }}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Delete"}
          </button>
        </section>

        {showConfirmModal && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <p>Are you sure you want to delete this category?</p>
              <div className={styles.buttonRow}>
                <button
                  onClick={handleDelete}
                  className={styles.deleteButton}
                  disabled={isSubmitting}
                >
                  Confirm Delete
                </button>
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className={styles.button}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {showModal && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <p>{modalMessage}</p>
              <button
                onClick={() => setShowModal(false)}
                className={styles.button}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Layout>
    </div>
  );
};

export default CategoryEditor;

export async function getServerSideProps(context) {
  const { req } = context;
  const cookies = cookie.parse(req.headers.cookie || '');
  const token = cookies.token || null;
  const decoded = verifyToken(token);

  if (!decoded) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  return {
    props: {
      user: decoded,
    },
  };
}
