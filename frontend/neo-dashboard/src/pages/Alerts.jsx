import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/api";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const unreadCount = useMemo(
    () => alerts.filter((a) => !a.is_read).length,
    [alerts]
  );

	const savedCount = saved.length;

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [alertsRes, watchlistRes] = await Promise.all([
			api.get("/alerts", { params: { unread_only: false } }),
			api.get("/auth/watchlist"),
		]);
		setAlerts(alertsRes.data || []);
		setSaved(Array.isArray(watchlistRes.data) ? watchlistRes.data : []);
    } catch (e) {
      setError(
        e?.response?.data?.detail ||
          e?.message ||
          "Failed to load alerts"
      );
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    try {
      await api.post("/alerts/mark-read");
      setAlerts((prev) => prev.map((a) => ({ ...a, is_read: true })));
    } catch (e) {
      setError(
        e?.response?.data?.detail || e?.message || "Failed to mark alerts as read"
      );
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="container">
      <div className="page-head">
        <div>
          <h1 className="h1">Alerts</h1>
          <p className="muted">
				{loading ? "Loading…" : `${unreadCount} unread • ${savedCount} saved`}
          </p>
			<p className="muted" style={{ marginTop: 6 }}>
				Alerts are generated only for items you save in <Link to="/watchlist">Watchlist</Link>.
			</p>
        </div>
        <div className="btn-row">
          <button className="btn btnSecondary" onClick={load} disabled={loading}>
            Refresh
          </button>
          <button
            className="btn"
            onClick={markAllRead}
            disabled={loading || alerts.length === 0 || unreadCount === 0}
          >
            Mark all read
          </button>
        </div>
      </div>

      {error ? <div className="alert error">{error}</div> : null}

      <div className="card" style={{ marginBottom: 16 }}>
      <h2 className="h2">Saved Asteroids (Monitored)</h2>
      <p className="muted" style={{ marginTop: 6 }}>
        These are the asteroids you saved for future alerts. “Close approach date” is the approach date saved from NASA at the time you clicked Watch.
      </p>
      {loading ? (
        <div className="muted" style={{ marginTop: 10 }}>
          Loading saved asteroids…
        </div>
      ) : saved.length === 0 ? (
        <div className="muted" style={{ marginTop: 10 }}>
          No saved asteroids yet.
        </div>
      ) : (
        <div className="tableWrap" style={{ marginTop: 10 }}>
          <table className="table">
            <thead>
              <tr>
                <th align="left">Name</th>
                <th align="left">NEO ID</th>
                <th align="right">Risk</th>
                <th align="left">Close approach date</th>
              </tr>
            </thead>
            <tbody>
              {saved
                .slice()
                .sort((a, b) => (b.risk_score ?? 0) - (a.risk_score ?? 0))
                .slice(0, 20)
                .map((row) => (
                  <tr key={row.id}>
                    <td>{row.name}</td>
                    <td>{row.neo_id}</td>
                    <td align="right">{Number(row.risk_score ?? 0).toFixed(2)}</td>
                    <td>{row.meta?.close_approach_date || "—"}</td>
                  </tr>
                ))}
            </tbody>
          </table>
          <p style={{ marginBottom: 0, opacity: 0.8 }}>
            Showing first 20 saved items.
          </p>
        </div>
      )}
      </div>

      <div className="card">
          {loading ? (
            <div className="muted">Fetching alerts…</div>
          ) : alerts.length === 0 ? (
            <div className="muted">No alerts yet.</div>
          ) : (
            <div className="tableWrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Message</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.map((a) => (
                    <tr key={a.id} className={!a.is_read ? "row-unread" : ""}>
                      <td>
                        <span className={`pill ${a.is_read ? "" : "pill-hot"}`}>
                          {a.is_read ? "Read" : "Unread"}
                        </span>
                      </td>
                      <td>{a.message}</td>
                      <td className="muted">
                        {a.created_at
                          ? new Date(a.created_at).toLocaleString()
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>
    </div>
  );
}
