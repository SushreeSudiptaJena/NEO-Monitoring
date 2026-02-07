import { useState } from "react";
import Watchlist from "../components/Watchlist";
import RiskChart from "../components/RiskChart";

export default function WatchPage() {
	const [watchlistItems, setWatchlistItems] = useState([]);

  return (
    <div className="container">
      <div className="page-head">
        <div>
          <h1 className="h1">Watchlist</h1>
				<p className="muted">
					{watchlistItems.length} saved — monitored for future alerts.
				</p>
        </div>
      </div>

      <div className="grid-2">
			<Watchlist onDataChange={setWatchlistItems} />
			<RiskChart items={watchlistItems} />
      </div>
    </div>
  );
}
