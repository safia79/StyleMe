// FR-11: Wardrobe Analytics

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { apiRequest } from "../api.js";

const COLOUR_HEX = {
  Black: "#1a1a1a",
  White: "#d9d4cc",
  Grey: "#8a8680",
  Navy: "#1e3a5f",
  Blue: "#3b6ea5",
  Red: "#b33a3a",
  Pink: "#d67a9a",
  Green: "#4a7c59",
  Beige: "#d4c4a8",
  Brown: "#6b4a2b",
  Yellow: "#d4b84a",
  Purple: "#6b4c9a",
  Orange: "#d4783a",
};

const CATEGORY_COLOURS = ["#8C3A1E", "#2A1F19", "#6B5344", "#A65D3A", "#5C534C", "#8F5A3A"];

function countBy(items, key) {
  const totals = {};
  items.forEach((item) => {
    const label = item[key] || "Unknown";
    totals[label] = (totals[label] || 0) + 1;
  });
  return Object.entries(totals)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

function Analytics() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const result = await apiRequest("/api/wardrobe");
      if (cancelled) return;
      if (!result.ok) {
        setError(result.data.error || "Could not load wardrobe analytics.");
      } else {
        setItems(result.data.items || []);
      }
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const categoryData = useMemo(() => countBy(items, "category"), [items]);
  const colourData = useMemo(() => countBy(items, "colour"), [items]);
  const mostWorn = useMemo(
    () =>
      [...items]
        .sort((a, b) => (b.wearCount || 0) - (a.wearCount || 0))
        .slice(0, 8)
        .map((item) => ({
          name: `${item.colour} ${item.category}`,
          wearCount: item.wearCount || 0,
        })),
    [items],
  );

  return (
    <main className="page page-wide">
      <header className="page-header">
        <div>
          <p className="page-kicker">Insights</p>
          <h1>Analytics</h1>
          <p>A live snapshot of your wardrobe, calculated from the items you have uploaded.</p>
        </div>
      </header>

      {loading ? <p>Loading analytics...</p> : null}
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}

      {!loading && items.length < 3 ? (
        <div className="placeholder-note">Add more items to see your wardrobe analytics</div>
      ) : null}

      {!loading && items.length >= 3 ? (
        <div className="analytics-grid">
          <section className="chart-card">
            <h2>Category breakdown</h2>
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                    {categoryData.map((entry, index) => (
                      <Cell key={entry.name} fill={CATEGORY_COLOURS[index % CATEGORY_COLOURS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="chart-card">
            <h2>Most-worn items</h2>
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={mostWorn} margin={{ top: 8, right: 8, left: 0, bottom: 32 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" interval={0} angle={-25} textAnchor="end" height={70} fontSize={11} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="wearCount" fill="#8C3A1E" name="Times worn" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="chart-card chart-card-wide">
            <h2>Dominant colours</h2>
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={colourData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" name="Items">
                    {colourData.map((entry) => (
                      <Cell key={entry.name} fill={COLOUR_HEX[entry.name] || "#8C3A1E"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>
      ) : null}

      <p className="form-switch">
        Upload extra pieces on the <Link to="/wardrobe">Wardrobe</Link> page.
      </p>
    </main>
  );
}

export default Analytics;
