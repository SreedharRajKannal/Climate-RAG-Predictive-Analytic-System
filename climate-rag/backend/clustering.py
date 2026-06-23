"""
clustering.py — K-Means clustering engine for historical weather data.

Provides:
- Elbow method to find optimal K
- K-Means fitting with auto-labeling
- Cluster summary statistics
"""

import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
import os
import sys

sys.path.append(os.path.dirname(__file__))
from database import SessionLocal, HistoricalReading


# Features used for clustering — chosen for maximum discriminative power
CLUSTER_FEATURES = [
    "temperature",
    "humidity",
    "precipitation",
    "wind_speed",
    "uv_index",
    "apparent_temperature",
]


def load_historical_data() -> pd.DataFrame:
    """Load all historical readings from the database into a DataFrame."""
    db = SessionLocal()
    readings = db.query(HistoricalReading).order_by(HistoricalReading.recorded_at.asc()).all()
    db.close()

    if not readings:
        return pd.DataFrame()

    records = []
    for r in readings:
        records.append({
            "recorded_at": r.recorded_at.isoformat() if r.recorded_at else None,
            "temperature": r.temperature,
            "humidity": r.humidity,
            "precipitation": r.precipitation,
            "wind_speed": r.wind_speed,
            "uv_index": r.uv_index,
            "pressure": r.pressure,
            "apparent_temperature": r.apparent_temperature,
            "cloud_cover": r.cloud_cover,
        })

    return pd.DataFrame(records)


def run_elbow_method(df: pd.DataFrame, k_range: range = range(1, 11)) -> list:
    """
    Run K-Means for each K in k_range and return inertia values.
    Used to generate the elbow chart on the frontend.
    """
    X = df[CLUSTER_FEATURES].fillna(0)
    if X.empty:
        return []

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    inertia_values = []
    for k in k_range:
        km = KMeans(n_clusters=k, random_state=42, n_init=10)
        km.fit(X_scaled)
        inertia_values.append({"k": k, "inertia": round(float(km.inertia_), 2)})

    return inertia_values


def find_optimal_k(inertia_values: list) -> int:
    """
    Use the elbow heuristic: find the K where the rate of decrease
    in inertia slows down the most (maximum second derivative).
    """
    if len(inertia_values) < 3:
        return 4  # sensible default for weather data

    inertias = [v["inertia"] for v in inertia_values]

    # Compute second differences (discrete second derivative)
    diffs = [inertias[i] - inertias[i + 1] for i in range(len(inertias) - 1)]
    second_diffs = [diffs[i] - diffs[i + 1] for i in range(len(diffs) - 1)]

    # The optimal K is where the second derivative is maximized
    # Add 2 because second_diffs starts at index 0 which corresponds to K=3
    optimal_idx = int(np.argmax(second_diffs)) + 2  # +2 because K starts at 1
    optimal_k = inertia_values[optimal_idx]["k"] if optimal_idx < len(inertia_values) else 4

    return max(2, min(optimal_k, 8))  # Clamp between 2 and 8


def label_cluster(center: dict) -> str:
    """
    Generate a human-readable label for a cluster based on its centroid values.
    Uses meteorological heuristics for Trivandrum-like tropical climates.
    """
    temp = center.get("temperature", 25)
    humidity = center.get("humidity", 70)
    precip = center.get("precipitation", 0)
    wind = center.get("wind_speed", 5)
    uv = center.get("uv_index", 5)

    # Monsoon: high rain + high humidity
    if precip > 2.0 and humidity > 80:
        return "Monsoon Peak"

    # Pre-monsoon heat: high temp + high UV + low rain
    if temp > 30 and uv > 7 and precip < 0.5:
        return "Pre-Monsoon Heat"

    # Hot and humid: high temp + high humidity + low rain
    if temp > 28 and humidity > 75 and precip < 1.0:
        return "Hot & Humid"

    # Overcast/mild: moderate temp + high cloud cover (inferred via low UV)
    if uv < 3 and temp < 28:
        return "Mild Overcast"

    # Windy period
    if wind > 15:
        return "Windy Period"

    # Cool night: low temp + low UV
    if temp < 25 and uv < 1:
        return "Cool Night"

    # Dry warm: moderate everything
    if precip < 0.3 and temp > 26:
        return "Dry & Warm"

    return "Transitional"


def run_kmeans(df: pd.DataFrame, n_clusters: int = None) -> dict:
    """
    Run K-Means clustering on the historical data.
    
    Returns:
        {
            "n_clusters": int,
            "clusters": [{"label": str, "center": dict, "count": int, "stats": dict}],
            "points": [{"recorded_at": str, "cluster": int, ...features}],
        }
    """
    X = df[CLUSTER_FEATURES].fillna(0)
    if X.empty:
        return {"n_clusters": 0, "clusters": [], "points": []}

    # Find optimal K if not specified
    if n_clusters is None:
        elbow = run_elbow_method(df)
        n_clusters = find_optimal_k(elbow)

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    km = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    labels = km.fit_predict(X_scaled)

    # Inverse-transform centers back to original scale
    centers_scaled = km.cluster_centers_
    centers_original = scaler.inverse_transform(centers_scaled)

    # Build cluster metadata
    valid_indices = X.index.tolist()
    df_valid = df.loc[valid_indices].copy()
    df_valid["cluster"] = labels

    clusters = []
    for i in range(n_clusters):
        cluster_df = df_valid[df_valid["cluster"] == i]
        center = {feat: round(float(centers_original[i][j]), 2) for j, feat in enumerate(CLUSTER_FEATURES)}

        stats = {}
        for feat in CLUSTER_FEATURES:
            col = cluster_df[feat].dropna()
            if not col.empty:
                stats[feat] = {
                    "mean": round(float(col.mean()), 2),
                    "min": round(float(col.min()), 2),
                    "max": round(float(col.max()), 2),
                    "std": round(float(col.std()), 2),
                }

        clusters.append({
            "id": i,
            "label": label_cluster(center),
            "center": center,
            "count": int(len(cluster_df)),
            "stats": stats,
        })

    # Build points array for scatter plot
    points = []
    for _, row in df_valid.iterrows():
        point = {
            "recorded_at": row.get("recorded_at", ""),
            "cluster": int(row["cluster"]),
        }
        for feat in CLUSTER_FEATURES:
            point[feat] = round(float(row[feat]), 2) if pd.notna(row[feat]) else None
        points.append(point)

    return {
        "n_clusters": n_clusters,
        "clusters": clusters,
        "points": points,
    }


def get_cluster_results(n_clusters: int = None) -> dict:
    """High-level function: load data → cluster → return results."""
    df = load_historical_data()
    if df.empty:
        return {"error": "No historical data found. Run historical_fetch.py first."}
    return run_kmeans(df, n_clusters)


def get_elbow_results() -> list:
    """High-level function: load data → run elbow → return inertia values."""
    df = load_historical_data()
    if df.empty:
        return []
    return run_elbow_method(df)


def get_scatter_data(sample: int = None) -> list:
    """
    Get scatter-plot-ready data points.
    Optionally randomly samples to keep the frontend fast for large datasets.
    """
    results = get_cluster_results()
    if "error" in results:
        return []

    points = results["points"]

    if sample and sample < len(points):
        rng = np.random.default_rng(42)
        indices = rng.choice(len(points), size=sample, replace=False)
        points = [points[i] for i in sorted(indices)]

    return {
        "n_clusters": results["n_clusters"],
        "clusters": results["clusters"],
        "points": points,
    }
