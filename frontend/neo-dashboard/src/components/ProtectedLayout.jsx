import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";

function Tab({ to, label, icon }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `side-tab ${isActive ? "active" : ""}`
      }
      aria-label={label}
      title={label}
      end
    >
      <span className="side-tab-icon" aria-hidden="true">
        {icon}
      </span>
      <span className="side-tab-label">{label}</span>
    </NavLink>
  );
}

export default function ProtectedLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const onLogout = () => {
    localStorage.removeItem("token");
    navigate("/login", { replace: true, state: { from: location.pathname } });
  };

  return (
    <div className="app-shell">
      <aside className="side-nav">
        <div className="side-nav-header">
          <div className="brand">NEO</div>
        </div>

        <nav className="side-nav-tabs">
          <Tab to="/dashboard" label="Dashboard" icon="🛰️" />
          <Tab to="/watchlist" label="Watchlist" icon="📌" />
          <Tab to="/alerts" label="Alerts" icon="🔔" />
        </nav>

        <div className="side-nav-footer">
          <button className="btn btn-ghost" onClick={onLogout}>
            Logout
          </button>
        </div>
      </aside>

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
