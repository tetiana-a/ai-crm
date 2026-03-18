export default function EmptyState({
  icon = '✦',
  title,
  text,
  actionText,
  onAction,
}) {
  return (
    <div className="empty-state fade-in">
      <div className="empty-state-icon">{icon}</div>

      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-text">{text}</p>

      {actionText && (
        <button className="primary-btn mt-4" onClick={onAction}>
          {actionText}
        </button>
      )}
    </div>
  );
}