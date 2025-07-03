import * as cookie from 'cookie';
import { verifyToken } from '../../lib/auth';
import styles from "../../styles/Update.module.css";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Layout from "../../components/Layout";
import ArticleContainer from "../../components/templates/Article";
import CategorySelector from "../../components/CategorySelector";

export default function Article() {
  // State and refs setup
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const router = useRouter();
  const { id } = router.query;
  const [isEditor, setIsEditor] = useState(false);
  const [currentContent, setCurrentContent] = useState("");
  const [editorContent, setEditorContent] = useState("");
  const refdiv = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [foundSlug, setFoundSlug] = useState("");
  const [searchStatus, setSearchStatus] = useState("");
  const [foundTitle, setFoundTitle] = useState("");
  const [editableTitle, setEditableTitle] = useState("");
  const [categoryPaths, setCategoryPaths] = useState([[]]);
  const [resetTriggers, setResetTriggers] = useState([false]);
  const [hyperlinks, setHyperlinks] = useState([""]);
  const [periods, setPeriods] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [deleteStatus, setDeleteStatus] = useState("");

  // Fetch available periods for dropdown
  useEffect(() => {
    const fetchPeriods = async () => {
      try {
        const res = await fetch("/api/periods");
        const data = await res.json();
        if (data.success) {
          setPeriods(data.periods);
        } else {
          console.error("Failed to fetch periods:", data.message);
        }
      } catch (err) {
        console.error("Error fetching periods:", err);
      }
    };
    fetchPeriods();
  }, []);

  const handlePeriodChange = (e) => {
    setSelectedPeriod(e.target.value);
  };

  // Build hierarchical paths from selected categories
  function buildCategoryPaths(categories, selectedCategoryIds) {
    const categoryMap = {};
    const childrenMap = {};

    categories.forEach((cat) => {
      categoryMap[cat.id] = cat;
      if (cat.parent_id !== null) {
        if (!childrenMap[cat.parent_id]) {
          childrenMap[cat.parent_id] = [];
        }
        childrenMap[cat.parent_id].push(cat.id);
      }
    });

    const selectedSet = new Set(selectedCategoryIds);
    const leafCategoryIds = selectedCategoryIds.filter((id) => {
      const children = childrenMap[id] || [];
      return !children.some(childId => selectedSet.has(childId));
    });

    function buildPath(leafId) {
      const path = [];
      let current = categoryMap[leafId];
      while (current) {
        path.unshift(current.id);
        current = categoryMap[current.parent_id];
      }
      return path;
    }

    const seen = new Set();
    const paths = [];

    leafCategoryIds.forEach((id) => {
      const path = buildPath(id);
      const pathKey = path.join("-");
      if (!seen.has(pathKey)) {
        paths.push(path);
        seen.add(pathKey);
      }
    });

    return paths;
  }

  // Cleanup editor floating UI elements to prevent duplicates
  const cleanupEditorArtifacts = () => {
    document
      .querySelectorAll("rte-floatpanel, .rte-tooltip, .rte-overlay, .rte-dialog")
      .forEach((el) => el.remove());
  };

  // Flatten and deduplicate category IDs from all paths
  const flattenUniqueCategoryIds = () => {
    const allIds = categoryPaths.flat();
    return [...new Set(allIds)];
  };

  // Category path selection handling
  const handleCategoryChange = (index, selectedPath) => {
    const updatedPaths = [...categoryPaths];
    if (JSON.stringify(updatedPaths[index]) === JSON.stringify(selectedPath)) return;
    updatedPaths[index] = selectedPath;
    setCategoryPaths(updatedPaths);
  };

  // Add new empty category selector
  const addCategorySelector = () => {
    const lastPath = categoryPaths[categoryPaths.length - 1];
    if (!lastPath || lastPath.length === 0) {
      alert("Please select a category in the last selector before adding a new one.");
      return;
    }
    setCategoryPaths([...categoryPaths, []]);
    setResetTriggers([...resetTriggers, false]);
  };

  // Remove category selector by index
  const removeCategorySelector = (indexToRemove) => {
    if (categoryPaths.length <= 1) return;
    const updatedPaths = categoryPaths.filter((_, i) => i !== indexToRemove);
    const updatedTriggers = resetTriggers.filter((_, i) => i !== indexToRemove);
    setCategoryPaths(updatedPaths);
    setResetTriggers(updatedTriggers);
  };

  // Initialize or destroy rich text editor instance on toggle
  useEffect(() => {
    if (isEditor && window.RichTextEditor && refdiv.current) {
      refdiv.current.innerHTML = "";
      const instance = new window.RichTextEditor(refdiv.current);
      instance.setHTMLCode(currentContent);

      instance.onChange = (htmlContent) => {
        setEditorContent(htmlContent);
      };

      instance.attachEvent("change", () => {
        const html = instance.getHTMLCode();
        setEditorContent(html);
      });
    } else if (!isEditor && refdiv.current) {
      refdiv.current.innerHTML = "";
    }
  }, [isEditor, currentContent]);

   // Toggle editor mode between plain HTML and rich text
  const toggleEditor = () => {
    cleanupEditorArtifacts();
    if (!isEditor) {
      setEditorContent(currentContent);
    } else {
      setCurrentContent(editorContent);
    }
    setIsEditor((prev) => !prev);
  };

  /**
   * DEMO submit handler.
   * This simulates a successful update without calling any API.
   * It shows success modal and redirects after delay.
   */
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      setShowSuccessModal(true);

      await new Promise((resolve) => setTimeout(resolve, 1000));

      setTimeout(() => {
        router.push("/");
      }, 1500);
    } catch (err) {
      console.error("Demo submit error:", err);
      alert("An error occurred in demo submit.");
    } finally {
      setIsSubmitting(false);
      cleanupEditorArtifacts();
    }
  };

  /**
   * REAL submit handler (commented out for demo purposes).
   * Uncomment this to perform actual update call.
   */
  /*
  const handleSubmit = async () => {
    setIsSubmitting(true);
    const categoryIds = flattenUniqueCategoryIds();
    try {
      const res = await fetch(`/api/update-post`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: foundSlug,
          title: editableTitle,
          content: editorContent,
          categoryIds,
          links: hyperlinks,
          period: selectedPeriod,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCurrentContent(editorContent);
        setShowSuccessModal(true);
        setTimeout(() => {
          router.push("/");
        }, 1500);
      } else {
        alert("Failed to update post!");
      }
    } catch (error) {
      console.error("Error updating post:", error);
      alert("An error occurred while updating the post.");
    } finally {
      setIsSubmitting(false);
      cleanupEditorArtifacts();
    }
  };
  */

  // Load post data when ID changes
  useEffect(() => {
    const handleSearch = async () => {
      if (!id) return;
      setSearchStatus("Searching...");
      try {
        const res = await fetch("/api/find-post", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ searchType: "id", searchTerm: id }),
        });

        const data = await res.json();

        if (res.ok && data.success) {
          setCurrentContent(data.content);
          setEditorContent(data.content);
          setFoundSlug(data.title.toLowerCase().replace(/['’‘‛`´]/g, "").replace(/\s+/g, "-"));
          setFoundTitle(data.title);
          setSearchStatus(`Loaded "${data.title}"`);
          setIsEditor(true);
          setEditableTitle(data.title);
          setSelectedPeriod(data.period);

          const catRes = await fetch(`/api/get-categories-for-post?postId=${data.id}`);
          const catData = await catRes.json();
          if (catData.success && Array.isArray(catData.categories)) {
            const paths = buildCategoryPaths(catData.categories, data.categoryIds || []);
            setCategoryPaths(paths.length ? paths : [[]]);
            setResetTriggers(new Array(paths.length).fill(false));
          } else {
            console.warn("Failed to load categories");
          }

          setHyperlinks(Array.isArray(data.links) && data.links.length > 0 ? data.links : [""]);
        } else {
          setSearchStatus(data.message || "No post found.");
          setTimeout(() => setSearchStatus(""), 4000);
        }
      } catch (err) {
        console.error("Search error:", err);
        setSearchStatus("Search failed.");
        setTimeout(() => setSearchStatus(""), 4000);
      }
    };
    handleSearch();
  }, [id]);

  // Hyperlink input handlers
  const handleLinkChange = (index, value) => {
    const updated = [...hyperlinks];
    updated[index] = value;
    setHyperlinks(updated);
  };

  const addNewLinkField = () => {
    setHyperlinks([...hyperlinks, ""]);
  };

  const removeLinkField = (index) => {
    const updated = [...hyperlinks];
    updated.splice(index, 1);
    setHyperlinks(updated);
  };

  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  // Delete post handler
  const handleDelete = async () => {
    try {
      const res = await fetch("/api/delete-entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: foundSlug }),
      });
      const data = await res.json();

      if (data.success) {
        setDeleteStatus("Entry deleted successfully!");
        setShowConfirmModal(false);
        setShowSuccessModal(true);

        setTimeout(() => {
          setShowSuccessModal(false);
          router.push("/");
        }, 1500);
      } else {
        setDeleteStatus("Failed to delete entry.");
      }
    } catch (error) {
      console.error("Delete error:", error);
      setDeleteStatus("An error occurred while deleting.");
    }
  };

  return (
    <div className={styles.container}>
      <Layout>
        <h2 className={styles.heading}>Update Entry</h2>
        {searchStatus && (
          <p
            className={styles.searchStatus}
            style={{
              color:
                searchStatus === 'Searching...'
                  ? 'black'
                  : searchStatus.toLowerCase().includes('fail') ||
                    searchStatus.toLowerCase().includes('no post')
                  ? 'red'
                  : 'green',
            }}
          >
            {searchStatus}
          </p>
        )}
        {foundSlug && (
          <button
            onClick={toggleEditor}
            disabled={isSubmitting}
            className={styles.button}
          >
            {isEditor ? 'Switch to Plain HTML' : 'Switch to Rich Text Editor'}
          </button>
        )}
        <br /><br />
        {isEditor ? (
          <>
            <input
              type="text"
              value={editableTitle}
              onChange={(e) => setEditableTitle(e.target.value)}
              className={styles.titleInput}
            />
            <div ref={refdiv} className={styles.editorContainer}></div>
            <div className={styles.periodAndLinkWrapper}>
              <div className={styles.periodSelector}>
                <h3>Select Period</h3>
                <select
                  value={selectedPeriod || ''}
                  onChange={handlePeriodChange}
                  className={styles.input}
                >
                  <option value="" disabled>Select a period</option>
                  {periods.map((period) => (
                    <option key={period.ID} value={period.ID}>
                      {period.period_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.linkSection}>
                <h3>Add Hyperlinks</h3>
                {hyperlinks.map((link, index) => (
                  <div key={index} className={styles.innerOptions}>
                    <div className={styles.linkRow}>
                      <input
                        type="text"
                        value={link}
                        placeholder="Enter URL"
                        onChange={(e) => handleLinkChange(index, e.target.value)}
                        className={styles.input}
                      />
                      {hyperlinks.length === 1 && index === 0 && isValidUrl(link) && (
                        <button onClick={addNewLinkField} className={styles.addLinkButton}>+ Add Hyperlink</button>
                      )}
                      {hyperlinks.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeLinkField(index)}
                          className={styles.removeLinkButton}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    {hyperlinks.length > 1 &&
                      index === hyperlinks.length - 1 &&
                      isValidUrl(link) && (
                        <button onClick={addNewLinkField} className={styles.addLinkButton}>
                          + Add Another Link
                        </button>
                      )}
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.categories}>
              <h3>Select Categories</h3>
              {categoryPaths.map((path, index) => (
                <div key={index} className={styles.categorySelectorWrapper}>
                  <CategorySelector
                    associatedCategories={path}
                    onSelectionChange={(selected) =>
                      handleCategoryChange(index, selected)
                    }
                    resetTrigger={resetTriggers[index]}
                  />
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => removeCategorySelector(index)}
                      className={styles.removeCategoryButton}
                    >
                      Remove Category
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addCategorySelector}
                className={styles.addCategoryButton}
              >
                + Add Another Category Path
              </button>
            </div>
            <div className={styles.buttonContainer}>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={styles.submitButton}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Post'}
              </button>
              <button
                className={styles.deleteButton}
                onClick={() => setShowConfirmModal(true)}
              >
                Delete Entry
              </button>
            </div>

            {showSuccessModal && (
              <div className={styles.modalOverlay}>
                <div className={styles.modal}>
                  <p>Entry updated successfully. Redirecting to Home Page.</p>
                </div>
              </div>
            )}

            {showConfirmModal && (
              <div className={styles.modalOverlay}>
                <div className={styles.modal}>
                  <p>Are you sure you want to delete this entry?</p>
                  <button onClick={handleDelete} className={styles.confirmDelete}>Confirm Delete</button>
                  <button onClick={() => setShowConfirmModal(false)}>Cancel</button>
                  {deleteStatus && <p>{deleteStatus}</p>}
                </div>
              </div>
            )}
          </>
        ) : (
          <ArticleContainer content={currentContent} title={foundTitle} />
        )}
      </Layout>
    </div>
  );
}

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
