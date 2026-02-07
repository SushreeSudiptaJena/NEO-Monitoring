import { useEffect, useState } from "react";
import API from "../api/api";

export default function Dashboard() {
	const [neos, setNeos] = useState([]);
	const [error, setError] = useState("");

	const [alertRiskThreshold, setAlertRiskThreshold] = useState(50);
	const [alertWindowHours, setAlertWindowHours] = useState(72);

	const loadNeos = async () => {
		try {
			const res = await API.get("/neo/today");
			setNeos(Array.isArray(res.data) ? res.data : []);
		} catch (err) {
			const detail = err?.response?.data?.detail;
			setError(detail || err?.message || "Failed to load NEO feed");
		}
	};

	useEffect(() => {
		loadNeos();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<div className="container">
			<div className="page-head">
				<div>
					<h1 className="h1">Real-Time NEO Feed (Today)</h1>
					<p className="muted">Track close approaches and watch items.</p>
				</div>
				<button className="btn btnSecondary" type="button" onClick={loadNeos}>
					Refresh
				</button>
			</div>

			<div className="stack">
				{error && <p className="error">{error}</p>}

				<div className="card">
					<div className="btnRow" style={{ alignItems: "end" }}>
						<div className="field" style={{ minWidth: 220 }}>
							<div className="label">Alert risk threshold</div>
							<input
								className="input"
								type="number"
								value={alertRiskThreshold}
								onChange={(e) => setAlertRiskThreshold(Number(e.target.value))}
								min={0}
								max={100}
							/>
						</div>
						<div className="field" style={{ minWidth: 220 }}>
							<div className="label">Alert window (hours)</div>
							<input
								className="input"
								type="number"
								value={alertWindowHours}
								onChange={(e) => setAlertWindowHours(Number(e.target.value))}
								min={1}
								max={720}
							/>
						</div>
					</div>
				</div>

				<div className="card">
					{neos.length === 0 ? (
						<p>No NEOs returned for today.</p>
					) : (
						<div className="tableWrap">
								<table className="table">
									<thead>
										<tr>
											<th align="left">Name</th>
											<th align="right">Velocity (km/s)</th>
											<th align="right">Miss dist (km)</th>
											<th align="right">Diameter (km)</th>
											<th align="left">Risk</th>
											<th />
										</tr>
									</thead>
									<tbody>
										{neos.slice(0, 20).map((n) => (
											<tr key={n.id}>
												<td>{n.name}</td>
												<td align="right">{Number(n.velocity_km_s).toFixed(2)}</td>
												<td align="right">{Number(n.miss_distance_km).toFixed(0)}</td>
												<td align="right">{Number(n.diameter_km).toFixed(3)}</td>
												<td>
													{n.risk_level} ({Number(n.risk_score).toFixed(1)})
												</td>
												<td align="right">
													<button
														className="btn"
														type="button"
														onClick={async () => {
															setError("");
															try {
																await API.post("/auth/watch", {
																	neo_id: n.id,
																	name: n.name,
																	risk_score: n.risk_score,
																	diameter_km: n.diameter_km,
																	velocity_km_s: n.velocity_km_s,
																	miss_distance_km: n.miss_distance_km,
																	close_approach_date: n.close_approach_date,
																	hazardous: n.hazardous,
																	risk_level: n.risk_level,
																	alert_risk_threshold: alertRiskThreshold,
																	alert_window_hours: alertWindowHours,
																});
														} catch (err) {
																const detail = err?.response?.data?.detail;
																setError(detail || err?.message || "Failed to watch asteroid");
															}
													}}
													>
													Watch
												</button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
							<p style={{ marginBottom: 0, opacity: 0.8 }}>
								Showing first 20 items.
							</p>
						</div>
					)}
					</div>
				</div>
		</div>
	);
}

