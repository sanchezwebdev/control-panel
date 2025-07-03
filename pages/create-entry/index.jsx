import * as cookie from 'cookie';
import { verifyToken } from '../../lib/auth';
import { useRouter } from "next/router";
import { useState, useEffect, useRef } from "react";
import Layout from "../../components/Layout";
import styles from "../../styles/Create.module.css";
import CategorySelector from "../../components/CategorySelector";
import { useSelection } from "../../context/SelectionContext";
import "dotenv/config";

const IndexPage = () => {
  const router = useRouter();

  // State for modals, form inputs, submission state, and refs
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const { newTitle } = useSelection();
  const [title, setTitle] = useState(newTitle || "");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const refdiv = useRef(null);

  // State for categories and their selection paths
  const [categories, setCategories] = useState([]);
  const [categoryPaths, setCategoryPaths] = useState([[]]);
  const [resetTriggers, setResetTriggers] = useState([false]);

  // State for hyperlinks input and time periods
  const [hyperlinks, setHyperlinks] = useState([""]);
  const [periods, setPeriods] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState(null);

  // Fetch available periods on component mount
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

  // Fetch category tree on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/categories-tree");
        const data = await res.json();
        if (data.success) {
          setCategories(data.categories);
        } else {
          console.error("Failed to fetch categories:", data.message);
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };
    fetchCategories();
  }, []);

  // Initialize rich text editor and handle content changes
  useEffect(() => {
    if (window.RichTextEditor && refdiv.current) {
      refdiv.current.innerHTML = "";
      const instance = new window.RichTextEditor(refdiv.current);
      instance.onChange = (html) => setContent(html);

      instance.attachEvent("change", () => {
        const html = instance.getHTMLCode();
        setContent(html);
      });
    }
  }, []);

  // Handle period dropdown change
  const handlePeriodChange = (e) => {
    setSelectedPeriod(e.target.value);
  };

  // Validate URL format
  const isValidUrl = (url) => {
    const urlRegex = /^(https?:\/\/)?([\w.-]+)\.([a-z\.]{2,6})([\\/\w .-]*)*\/?$/i;
    return urlRegex.test(url);
  };

  // Handle hyperlink input changes
  const handleLinkChange = (index, value) => {
    const updatedLinks = [...hyperlinks];
    updatedLinks[index] = value;
    setHyperlinks(updatedLinks);
  };

  // Add a new hyperlink input field
  const addNewLinkField = () => {
    setHyperlinks([...hyperlinks, ""]);
  };

  // Remove a hyperlink input field by index
  const removeLinkField = (indexToRemove) => {
    setHyperlinks((prevLinks) =>
      prevLinks.filter((_, index) => index !== indexToRemove)
    );
  };

  // Handle category selection change at a specific index
  const handleCategoryChange = (index, selectedPath) => {
    const updatedPaths = [...categoryPaths];
    if (JSON.stringify(updatedPaths[index]) === JSON.stringify(selectedPath))
      return;
    updatedPaths[index] = selectedPath;
    setCategoryPaths(updatedPaths);
  };

  // Add another category selector (category path)
  const addCategorySelector = () => {
    const lastPath = categoryPaths[categoryPaths.length - 1];
    if (!lastPath || lastPath.length === 0) {
      alert("Please select a category in the last selector before adding a new one.");
      return;
    }
    setCategoryPaths([...categoryPaths, []]);
    setResetTriggers([...resetTriggers, false]);
  };

  // Remove a category selector by index
  const removeCategorySelector = (indexToRemove) => {
    if (categoryPaths.length <= 1) return;
    const updatedPaths = categoryPaths.filter((_, i) => i !== indexToRemove);
    const updatedTriggers = resetTriggers.filter((_, i) => i !== indexToRemove);
    setCategoryPaths(updatedPaths);
    setResetTriggers(updatedTriggers);
  };

  // Flatten category paths and return unique category IDs
  const flattenUniqueCategoryIds = () => {
    const allIds = categoryPaths.flat();
    return [...new Set(allIds)];
  };
  
  /**
   * DEMO submit handler.
   * This handler simulates a successful post submission WITHOUT actually calling an API.
   * It shows the success modal and redirects after a delay.
   */
  const handleSubmit = async () => {
    if (!title || !content) {
      alert("All fields are required.");
      return;
    }

    const validLinks = hyperlinks.filter((link) => isValidUrl(link));
    setIsSubmitting(true);

    try {      
      setShowSuccessModal(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setTimeout(() => {
        router.push("/");
      }, 1500);
    } catch (err) {
      console.error(err);
      alert("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * REAL submit handler (commented out for demo purposes).
   * This would actually call the API to create the post.
   */
  /*
  const handleSubmit = async () => {
    if (!title || !content) {
      alert("All fields are required.");
      return;
    }

    const validLinks = hyperlinks.filter((link) => isValidUrl(link));
    setIsSubmitting(true);

    try {
      const uniqueCategoryIds = flattenUniqueCategoryIds();

      const res = await fetch("/api/create-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          categoryIds: uniqueCategoryIds,
          links: validLinks,
          period: selectedPeriod,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowSuccessModal(true);
        setTimeout(() => {
          router.push("/");
        }, 1500);
      } else {
        alert("Failed to create post.");
      }
    } catch (err) {
      console.error(err);
      alert("Server error.");
    } finally {
      setIsSubmitting(false);
    }
  };
  */

  return (
    <div className={styles.container}>
      <Layout>
        <h1>Create New Post</h1>
        <div>
          <h3><strong>Title:</strong> {title}</h3>
          <div ref={refdiv}></div>
          <div className={styles.periodAndLinkWrapper}>
            <div className={styles.periodSelector}>
              <h3>Select Period</h3>
              <select value={selectedPeriod || ""} onChange={handlePeriodChange} className={styles.input}>
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
                      <button onClick={addNewLinkField} className={styles.addLinkButton}>
                        + Add Hyperlink
                      </button>
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
                  categories={categories}
                  onSelectionChange={(selected) => handleCategoryChange(index, selected)}
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

          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={styles.submitButton}
          >
            {isSubmitting ? "Submitting..." : "Create Post"}
          </button>
          {showSuccessModal && (
            <div className={styles.modalOverlay}>
              <div className={styles.modal}>
                <p>Post created. Redirecting to dashboard...</p>
              </div>
            </div>
          )}
        </div>
      </Layout>
    </div>
  );
};

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

export default IndexPage;
