import React, { useEffect, useState } from "react";
import Navbar from "./Navbar";
import styles from "../styles/Layout.module.css";

const Layout = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/me");
        if (!res.ok) throw new Error("Not logged in");
        const data = await res.json();        
        setUser(data.user);
      } catch (err) {
        setUser(null);
      }
    };
    fetchUser();
  }, []);

  return (
    <div className={styles.container}>      
      <div className={styles.header}>
        {user ? `Logged In as ${user.user_nicename}` : "Loading..."}
      </div>
      <Navbar />
      <main>{children}</main>
      <footer></footer>
    </div>
  );
};

export default Layout;
