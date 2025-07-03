import styles from "../../styles/Article.module.css";

export default function ArticleContainer({ content, title }) {
  return (
    <div className={styles.container}>
      <div className={styles.innerContainer}>
        <h1 className = {styles.title}>{title}</h1>
        <div
          className={styles.articleContent}
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
    </div>
  );
}
