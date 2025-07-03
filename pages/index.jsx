import * as cookie from 'cookie';
import { verifyToken } from '../lib/auth';
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Layout from "../components/Layout";
import styles from "../styles/Home.module.css";
import { useSelection } from "../context/SelectionContext";

const Home = ({ fetchedData, filterOptions, page, itemsPerPage }) => {
  const router = useRouter();
  const [titleAvailable, setTitleAvailable] = useState(false);
  const [currentPage, setCurrentPage] = useState(page);
  const [perPage, setPerPage] = useState(itemsPerPage);

  useEffect(() => {
    setCurrentPage(page);
    setPerPage(itemsPerPage);
  }, [page, itemsPerPage]);

  const { selectedRow, setSelectedRow, setNewTitle } = useSelection();  
  const dataRows = fetchedData.rows || [];
  const totalCount = fetchedData.totalCount || 0;
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const displayedData = dataRows;

  const [filters, setFilters] = useState({
    title: router.query.title || "",
    category: router.query.category || "",
    author: router.query.author || "",
    period: router.query.period || "",
  });
    
  const [postSlug, setPostSlug] = useState("");  
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [deleteStatus, setDeleteStatus] = useState("");

useEffect(() => {
  if (!router.isReady) return; 

  if (!router.query.search) {
    setFilters({
      title: "",
      category: "",
      author: "",
      period: "",
    });
    setTitleAvailable(false);
  }
}, [router.isReady, router.query]);

  useEffect(() => {
    const fetchPost = async () => {
      if (!selectedRow) {        
        
        setPostSlug("");        
        return;
      }

      try {
        const res = await fetch("/api/find-post", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ searchType: "id", searchTerm: selectedRow.id }),
        });

        const data = await res.json();

        if (res.ok && data.success) {
          setPostSlug(data.title.toLowerCase().replace(/\s+/g, "-"));          
        } 
      } catch (err) {
        console.error("Error loading post by ID:", err);
        
      }
    };

    fetchPost();
  }, [selectedRow]);
  
  const handleDelete = async () => {
    try {
      const res = await fetch("/api/delete-entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: postSlug }),
      });

      const data = await res.json();

      if (data.success) {
        setDeleteStatus("Entry deleted successfully!");
          setTimeout(() => {
            setDeleteStatus("");
          }, 3000);                
        setPostSlug("");        
        setShowConfirmModal(false);
        setShowSuccessModal(true);
        setSelectedRow(null);
        setTimeout(() => {
          setShowSuccessModal(false);
          router.push("/"); 
        }, 1500);
      } else {
        setDeleteStatus("Failed to delete entry.");
          setTimeout(() => {
            setDeleteStatus("");
          }, 3000);
      }
    } catch (error) {
      console.error("Delete error:", error);
      setDeleteStatus("An error occurred while deleting.");
    }
  };

  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

const handleSubmit = (e) => {
  e.preventDefault();

  const buttonName = e.nativeEvent.submitter?.name;
  const enteredTitle = filters.title.trim();

   if (!enteredTitle) {    
    setTitleAvailable(false);
    
    if (buttonName === "create") {
      alert("Please enter a title.");
      return;
    }
    
    router.push({
      pathname: "/",
      query: {
        ...filters,
        search: "true",
        page: 1,
        itemsPerPage: perPage,
      },
    });
    return;
  }

  if (buttonName === "search") {
    const titleExists = dataRows.some(
      (entry) => entry.title.toLowerCase() === enteredTitle.toLowerCase()
    );

    if (titleExists) {      
      setTitleAvailable(false);
      setTimeout(() => {        
      }, 4000);
    } else {      
      setTitleAvailable(true);
    }

    router.push({
      pathname: "/",
      query: {
        ...filters,
        search: "true",
        page: 1,
        itemsPerPage: perPage,
      },
    });
  }

  if (buttonName === "create") {
    setNewTitle(enteredTitle);
    router.push("/create-entry");
  }
};

  const handlePageChange = (newPage) => {
    router.push({
      pathname: "/",
      query: {
        ...router.query,
        page: newPage,
        itemsPerPage: perPage,
        search: "true",
      },
    });
  };

  const handleItemsPerPageChange = (e) => {
    const newItemsPerPage = e.target.value === "" ? 1000 : parseInt(e.target.value);
    setPerPage(newItemsPerPage);
    router.push({
      pathname: "/",
      query: {
        ...router.query,
        page: 1,
        itemsPerPage: newItemsPerPage,
        search: "true",
      },
    });
  };

  return (
    <Layout>
      <div className={styles.container}>
        <form onSubmit={handleSubmit} className={styles.filterForm}>
          <input
            type="text"
            name="title"
            value={filters.title}
            onChange={handleChange}
            placeholder="Enter Title"
          />
          <select name="category" value={filters.category} onChange={handleChange}>
            <option value="">All Categories</option>
            {filterOptions.categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select name="author" value={filters.author} onChange={handleChange}>
            <option value="">All Authors</option>
            {filterOptions.authors.map((auth) => (
              <option key={auth} value={auth}>{auth}</option>
            ))}
          </select>
          <select name="period" value={filters.period} onChange={handleChange}>
            <option value="">All Periods</option>
            {filterOptions.periods.map((per) => (
              <option key={per} value={per}>{per}</option>
            ))}
          </select>
          <label className={styles.perPage}>
            Show per page:&nbsp;
            <select value={perPage} onChange={handleItemsPerPageChange}>
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={100}>100</option>
            </select>
          </label>
          <button type="submit" name="search"><i class="bi bi-search"></i></button>
          {titleAvailable && (
          <button type="submit" name="create">Create</button>                                
          )}
                            
        </form>
        {titleAvailable && (
          <p className={styles.successMessage}>Title not found. You can create a new entry.</p>                                                                
        )}                                  

        {displayedData.length > 0 ? (
          <>
            <div className={styles.innerContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Author</th>
                    <th>Period</th>
                    <th>Categories</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedData.map((post) => (
                    <tr
                      key={post.id}
                      className={`${styles.tableRow} ${selectedRow?.id === post.id ? styles.selectedRow : ""}`}
                      onClick={() => setSelectedRow(post)}
                      onDoubleClick={() => {
                        setSelectedRow(post);
                        router.push(`/update-entry?id=${post.id}`);
                      }}
                    >
                      <td>{post.title}</td>
                      <td>{post.author || "Unknown"}</td>
                      <td>{post.period || "N/A"}</td>
                      <td>{post.categories.join(", ") || "Uncategorized"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div></div>
        )}

        {totalCount > itemsPerPage && (
          <div className={styles.pagination}>
            {Array.from({ length: totalPages }, (_, index) => (
              <button
                key={index + 1}
                onClick={() => handlePageChange(index + 1)}
                className={index + 1 === currentPage ? styles.activePage : ""}
              >
                {index + 1}
              </button>
            ))}
          </div>
        )}
      </div>

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

      {showSuccessModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <p>Entry deleted successfully.</p>
          </div>
        </div>
      )}

    </Layout>
  );
};

export async function getServerSideProps(context) {
  const req = context.req;
  const cookies = cookie.parse(req.headers.cookie || '');
  const token = cookies.token || null;
  const decoded = verifyToken(token);
  const { query } = context;

  if (!decoded) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  const { fetchFilterOptions } = await import("../lib/fetch_filters");
  const filterOptions = await fetchFilterOptions();

  const isSearchSubmitted = 'search' in query;

  if (!isSearchSubmitted) {
    return {
      props: {
        fetchedData: { rows: [], totalCount: 0 },
        filterOptions,
        page: 1,
        itemsPerPage: 25,
      },
    };
  }

  const { fetchData } = await import("../lib/fetch_data");

  const page = parseInt(query.page || "1");
  const itemsPerPage = parseInt(query.itemsPerPage || "25");
  const offset = (page - 1) * itemsPerPage;

  const fetchedData = await fetchData({
    title: query.title || "",
    category: query.category || "",
    author: query.author || "",
    period: query.period || "",
    limit: itemsPerPage,
    offset: offset,
  });

  return {
    props: {
      fetchedData,
      filterOptions,
      page,
      itemsPerPage,
    },
  };
}

export default Home;
