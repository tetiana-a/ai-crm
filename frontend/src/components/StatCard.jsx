export default function StatCard({ icon, title, value, trend }) {
  return (
    <div className="stat-card">
      {icon && <div className="stat-icon">{icon}</div>}
      <div className="stat-label">{title}</div>
      <div className="stat-value">{value}</div>
      {trend && <div className="stat-trend">{trend}</div>}
    </div>
  );
}
