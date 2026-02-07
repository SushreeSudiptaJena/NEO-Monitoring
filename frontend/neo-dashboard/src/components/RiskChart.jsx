import {
	Bar,
	BarChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

export default function RiskChart({ items }) {
	const data = (items || []).map((x) => ({
		name: x.name,
		risk: Number(x.risk_score ?? 0),
	}));

	if (!data.length) {
		return (
			<div className="card" style={{ textAlign: "left" }}>
				<h3 style={{ marginTop: 0 }}>Risk Chart</h3>
				<p>Add items to your watchlist to see a chart.</p>
			</div>
		);
	}

	return (
		<div className="card">
			<h3 className="title" style={{ fontSize: "1.05rem" }}>Risk Chart</h3>
			<div style={{ width: "100%", height: 280 }}>
				<ResponsiveContainer>
					<BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 16 }}>
						<CartesianGrid strokeDasharray="3 3" />
						<XAxis dataKey="name" hide />
						<YAxis />
						<Tooltip />
						<Bar dataKey="risk" fill="var(--accent)" />
					</BarChart>
				</ResponsiveContainer>
			</div>
			<p style={{ marginBottom: 0, opacity: 0.8 }}>
				Bars show watchlist risk scores.
			</p>
		</div>
	);
}

