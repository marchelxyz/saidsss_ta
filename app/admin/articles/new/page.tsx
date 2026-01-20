import ArticleForm from "../ArticleForm";

export default function NewArticlePage() {
  return (
    <div>
      <div className="admin-toolbar">
        <h1 className="section-title">Новая статья</h1>
      </div>
      <ArticleForm />
    </div>
  );
}
