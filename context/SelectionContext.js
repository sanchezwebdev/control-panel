// Context provider for managing row selection, new title, and delete modal state across the app
import { createContext, useContext, useState } from "react";
import { useRouter } from "next/router";

const SelectionContext = createContext();

export const SelectionProvider = ({ children }) => {
  const [selectedRow, setSelectedRow] = useState(null);
  const [newTitle, setNewTitle] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteStatus, setDeleteStatus] = useState("");
  const router = useRouter();

  const handleDelete = async () => {
    if (!selectedRow) return;

    try {
      const res = await fetch("/api/delete-entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: selectedRow.title.toLowerCase().replace(/\s+/g, "-"),
        }),
      });

      const data = await res.json();

      if (data.success) {
        setDeleteStatus("Entry deleted successfully!");
        setSelectedRow(null);
        setShowDeleteModal(false);

        setTimeout(() => {
          setDeleteStatus("");
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
    <SelectionContext.Provider
      value={{
        selectedRow,
        setSelectedRow,
        newTitle,
        setNewTitle,
        showDeleteModal,
        setShowDeleteModal,
        deleteStatus,
        handleDelete,
      }}
    >
      {children}
    </SelectionContext.Provider>
  );
};

export const useSelection = () => useContext(SelectionContext);
