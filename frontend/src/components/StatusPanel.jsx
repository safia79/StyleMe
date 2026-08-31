// Reusable loading / empty / spinner pieces so pages look the same.
export function LoadingState({ message = "Loading..." }) {
  return (
    <div className="status-panel" role="status">
      <div className="spinner" aria-hidden="true" />
      <p>{message}</p>
    </div>
  );
}

// Friendly "nothing here yet" block, with an optional button or link.
export function EmptyState({ title, message, action }) {
  return (
    <div className="empty-state">
      {title ? <h2>{title}</h2> : null}
      {message ? <p>{message}</p> : null}
      {action ? <div className="empty-state-action">{action}</div> : null}
    </div>
  );
}

// Tiny spinner drawn inside a button while a request is running.
export function ButtonSpinner() {
  return <span className="btn-spinner" aria-hidden="true" />;
}
