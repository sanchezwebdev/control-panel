const RichTextContainer = ({ richTextContent, title }) => {
  return (
    <div className={styles.container}>
      <div className={styles.innerContainer}>
        <h1 className={styles.title}>{title}</h1>
        <div className={styles.articleContent}>
          {richTextContent}
        </div>
      </div>
    </div>
  );
};

export default RichTextContainer;
