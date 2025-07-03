import { useEffect, useState, useRef } from "react";

 // This component allows a user to drill down through a hierarchical category tree, showing buttons for each category level.
export default function CategorySelector({
  associatedCategories = [],
  onSelectionChange,
  resetTrigger = false,
}) {  
  const [categoryTree, setCategoryTree] = useState([]);  
  const [pathStack, setPathStack] = useState([]);  
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);  
  const initializedRef = useRef(false);
  
   // Fetch the full tree of categories on mount   
  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch("/api/categories-tree");
        const data = await res.json();
        if (data.success) {
          setCategoryTree(data.categories);
        } else {
          console.error("Invalid category data format", data);
        }
      } catch (err) {
        console.error("Failed to fetch category tree:", err);
      }
    }
    fetchCategories();
  }, []);
  
   // Initialize path stack 
  useEffect(() => {
    if (categoryTree.length > 0 && associatedCategories && associatedCategories.length > 0) {
      setPathStack([...associatedCategories]);
      setSelectedCategoryIds([...associatedCategories]);
      initializedRef.current = true;
    }
  }, [categoryTree, associatedCategories]);

  useEffect(() => {
    if (resetTrigger === true) {
      setPathStack([]);
      setSelectedCategoryIds([]);
      initializedRef.current = false;
    }
  }, [resetTrigger]);

   // Notify parent when selected categories change
  useEffect(() => {
    if (onSelectionChange && selectedCategoryIds.length > 0) {
      onSelectionChange(selectedCategoryIds);
    }
  }, [selectedCategoryIds, onSelectionChange]);

  if (!Array.isArray(categoryTree) || categoryTree.length === 0) {
    return <div>Loading categories...</div>;
  }

   // Find the subcategories at the current level based on path  
  function getCurrentLevel(tree, path) {
    let level = tree;
    for (const id of path) {
      const next = level.find((cat) => cat.id === id);
      if (!next || !next.children) return [];
      level = next.children;
    }
    return Array.isArray(level) ? level : [];
  }

    // Handle selecting a new category at the current level and add to the pathStack
  function handleSelect(category) {
    const newPath = [...pathStack, category.id];
    setPathStack(newPath);
    setSelectedCategoryIds(newPath);
  }

    //Go back to a certain level in the path
  function handleBacktrack(index) {
    const newPathStack = pathStack.slice(0, index + 1);
    setPathStack(newPathStack);
    setSelectedCategoryIds(newPathStack);
  }
 
    // Clear entire selection
  function handleClearSelection() {
    setPathStack([]);
    setSelectedCategoryIds([]);
  }

  // Get categories for current level in tree
  const currentLevel = getCurrentLevel(categoryTree, pathStack);

  return (
    <div>
      {/* Breadcrumb and clear button */}
      <div className="mb-2">
        {pathStack.length > 0 && (
          <button
            onClick={handleClearSelection}
            className="mr-2 px-2 py-1 bg-red-200 rounded hover:bg-red-300"
          >
            Clear Selection
          </button>
        )}

        {/* Breadcrumb path buttons */}
        {pathStack.map((id, index) => {
          const label = findLabelById(
            categoryTree,
            pathStack.slice(0, index + 1)
          );
          return (
            <button
              key={id}
              onClick={() => handleBacktrack(index)}
              className="mr-2 px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Current level categories */}
      <div className="grid gap-2">
        {Array.isArray(currentLevel) && currentLevel.length > 0 ? (
          currentLevel.map((category) => (
            <button
              key={category.id}
              onClick={() => handleSelect(category)}
              className={`px-4 py-2 border rounded hover:bg-gray-100 ${
                selectedCategoryIds.includes(category.id)
                  ? "bg-blue-100 border-blue-300"
                  : "bg-white"
              }`}
            >
              {category.name}
              {category.children && category.children.length > 0 && (
                <span className="ml-2 text-gray-500">►</span>
              )}
            </button>
          ))
        ) : (
          <div>No categories available at this level</div>
        )}
      </div>

      {/* Path summary */}
      {selectedCategoryIds.length > 0 && (
        <div>
          <p>Current selection path:</p>
          <div>
            {pathStack.map((id, index) => {
              const name = findLabelById(
                categoryTree,
                pathStack.slice(0, index + 1)
              );
              return (
                <span key={id}>
                  {name}
                  {index < pathStack.length - 1 && " > "}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

 // Helper: Find the display name for a given category ID by walking down the path
function findLabelById(tree, path) {
  function findNodeById(nodes, targetId) {
    for (const node of nodes) {
      if (node.id === targetId) {
        return node;
      }
      if (node.children && node.children.length > 0) {
        const found = findNodeById(node.children, targetId);
        if (found) return found;
      }
    }
    return null;
  }

  const targetId = path[path.length - 1];
  const foundNode = findNodeById(tree, targetId);
  return foundNode?.name;
}
