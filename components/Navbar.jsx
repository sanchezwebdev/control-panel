import Link from "next/link";
import styles from "../styles/Navbar.module.css";
import { useRouter } from "next/router";
import { useSelection } from "../context/SelectionContext";

const Navbar = () => {
  const {    
    setSelectedRow,    
  } = useSelection();
  const router = useRouter();

  const handleBrandClick = () => {
    setSelectedRow(null);
  };

  const handleLogout = async () => {
    await fetch("/api/logout");
    router.push("/login");
  };

  return (
    <nav className={`navbar navbar-expand-lg ${styles.navbarCustom} mb-4`}>
      <div className="container-fluid">
        <Link href="/" passHref legacyBehavior>
          <a className={styles.navBrand} onClick={handleBrandClick}>
            KoW Admin Panel
          </a>
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">            
              {router.pathname !== "/edit-categories" && (
                <li className="nav-item">
                  <Link
                    className={styles.navLink}
                    href={{
                      pathname: "/edit-categories",                      
                    }}
                  >
                    Categories
                  </Link>
                </li>
              )}            

            <li className="nav-item">
              <Link className={styles.navLink} onClick={handleLogout} href={{}}>
                Logout
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
