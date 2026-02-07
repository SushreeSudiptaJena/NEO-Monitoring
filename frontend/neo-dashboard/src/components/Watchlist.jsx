import {
	forwardRef,
	useCallback,
	useEffect,
	useImperativeHandle,
	useMemo,
	useRef,
	useState,
} from "react";
import API from "../api/api";

const Watchlist = forwardRef(function Watchlist({ onDataChange, refreshKey = 0 }, ref) {
	const [items, setItems] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [edit, setEdit] = useState({});
	const loadSeq = useRef(0);
	const [savingId, setSavingId] = useState(null);
	const [deletingId, setDeletingId] = useState(null);

	const sortedItems = useMemo(() => {
		return [...items].sort((a, b) => (b.risk_score ?? 0) - (a.risk_score ?? 0));
	}, [items]);

	const load = useCallback(async () => {
		const seq = ++loadSeq.current;
		setLoading(true);
		setError("");
		try {
			const res = await API.get("/auth/watchlist");
			// Ignore out-of-order responses when multiple loads overlap.
			if (seq !== loadSeq.current) return;

			const nextItems = Array.isArray(res.data) ? res.data : [];
			setItems(nextItems);
			onDataChange?.(nextItems);

			const nextEdit = {};
			for (const row of nextItems) {
				nextEdit[row.id] = {
					alert_risk_threshold: row.meta?.alert_risk_threshold ?? 50,
					alert_window_hours: row.meta?.alert_window_hours ?? 72,
				};
			}
			setEdit(nextEdit);
		} catch (err) {
			if (seq !== loadSeq.current) return;
			const detail = err?.response?.data?.detail;
			setError(detail || err?.message || "Failed to load watchlist");
		} finally {
			if (seq === loadSeq.current) setLoading(false);
		}
	}, [onDataChange]);

	useImperativeHandle(
		ref,
		() => ({
			reload: () => load(),
		}),
		[load]
	);

	useEffect(() => {
		load();
	}, [load, refreshKey]);

	const handleDelete = async (watchId) => {
		if (deletingId != null || savingId != null) return;
		setDeletingId(watchId);
		setError("");

		// Optimistic UI: remove the row immediately.
		setItems((prev) => {
			const next = prev.filter((x) => x.id !== watchId);
			onDataChange?.(next);
			return next;
		});
		setEdit((prev) => {
			const next = { ...prev };
			delete next[watchId];
			return next;
		});
		try {
			await API.delete(`/auth/watch/${watchId}`);
			// Refresh to ensure server is the source of truth.
			await load();
		} catch (err) {
			const detail = err?.response?.data?.detail;
			setError(detail || err?.message || "Delete failed");
			await load();
		} finally {
			setDeletingId(null);
		}
	};

	const handleSaveSettings = async (watchId) => {
		const payload = edit[watchId];
		if (!payload) return;
		if (deletingId != null || savingId != null) return;
		setSavingId(watchId);
		setError("");

		try {
			await API.put(`/auth/watch/${watchId}/alert-settings`, {
				alert_risk_threshold: Number(payload.alert_risk_threshold),
				alert_window_hours: Number(payload.alert_window_hours),
			});
			await load();
		} catch (err) {
			const detail = err?.response?.data?.detail;
			setError(detail || err?.message || "Failed to update alert settings");
		} finally {
			setSavingId(null);
		}
	};

	return (
		<div className="card">
			<h3 className="title" style={{ fontSize: "1.05rem" }}>Watchlist</h3>
			<p className="subtitle" style={{ marginTop: 6 }}>
				Saved asteroids are monitored for future alerts. Adjust thresholds per row and click Save.
			</p>
			{error && <p className="error">{error}</p>}
			{loading && items.length > 0 && (
				<p className="subtitle" style={{ marginTop: 0 }}>
					Updating…
				</p>
			)}

			{loading && items.length === 0 ? (
				<p>Loading watchlist…</p>
			) : sortedItems.length === 0 ? (
				<p>No watched asteroids yet.</p>
			) : (
				<div className="tableWrap">
					<table className="table">
						<thead>
							<tr>
								<th align="left">Name</th>
								<th align="left">NEO ID</th>
								<th align="right">Risk</th>
								<th align="left">Close approach</th>
								<th align="left">Alert settings</th>
								<th />
							</tr>
						</thead>
						<tbody>
							{sortedItems.map((row) => (
								<tr key={row.id}>
									<td>{row.name}</td>
									<td>{row.neo_id}</td>
									<td align="right">{Number(row.risk_score ?? 0).toFixed(2)}</td>
									<td>
										{row.meta?.close_approach_date || "—"}
									</td>
									<td>
										<div className="btnRow">
											<label>
												≥
												<input
													className="input"
													style={{ width: 110 }}
													type="number"
													min={0}
													max={100}
													value={edit[row.id]?.alert_risk_threshold ?? 50}
													onChange={(e) =>
														setEdit((prev) => ({
															...prev,
															[row.id]: {
																...prev[row.id],
																alert_risk_threshold: e.target.value,
															},
														}))
													}
												/>
											</label>
											<label>
												window(h)
												<input
													className="input"
													style={{ width: 110 }}
													type="number"
													min={1}
													max={720}
													value={edit[row.id]?.alert_window_hours ?? 72}
													onChange={(e) =>
														setEdit((prev) => ({
															...prev,
															[row.id]: {
																...prev[row.id],
																alert_window_hours: e.target.value,
															},
														}))
													}
												/>
											</label>
											<button
												className="btn btnSecondary"
												type="button"
												disabled={savingId === row.id || deletingId != null}
												onClick={() => handleSaveSettings(row.id)}
											>
												Save
											</button>
										</div>
									</td>
									<td align="right">
										<button
											className="btn btnDanger"
											type="button"
											disabled={deletingId === row.id || savingId != null}
											onClick={() => handleDelete(row.id)}
										>
											Delete
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
});

export default Watchlist;

