"""
clustering.py — K-Means clustering engine for historical weather data.

Provides:
- Fixed 4-cluster K-Means fitting with auto-labeling
- Model persistence via joblib
- Elbow method for visualization
- Cluster summary statistics
"""

import pandas as pd
import numpy as np
import joblib
import os
import sys
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

sys.path.append(os.path.dirname(__file__))
from database import SessionLocal, HistoricalReading

# Fixed number of clusters
N_CLUSTERS = 4

# Model persistence paths — /app/ inside Docker, local dir outside Docker
MODEL_DIR = "/app" if os.path.isdir("/app") else os.path.dirname(__file__)
KMEANS_MODEL_PATH = os.path.join(MODEL_DIR, "kmeans_model.pkl")
SCALER_MODEL_PATH = os.path.join(MODEL_DIR, "kmeans_scaler.pkl")

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


def label_cluster(center: dict) -> str:
    """
    Generate a human-readable label using a composite scoring approach.
    All 6 features contribute to each candidate label's score simultaneously.
    The highest-scoring label wins, preventing single-feature misclassification.
    """
    temp = center.get("temperature", 25)
    humidity = center.get("humidity", 70)
    precip = center.get("precipitation", 0)
    wind = center.get("wind_speed", 5)
    uv = center.get("uv_index", 5)
    apparent = center.get("apparent_temperature", temp)

    scores = {}

    # Heavy Monsoon: very high precip + very high humidity + moderate temp + low UV + high wind
    scores["Heavy Monsoon"] = (
        3.0 * min(precip / 2.0, 2.0) +       # precip > 2mm scores high (max 6.0)
        2.0 * max(0, (humidity - 80) / 15) +  # humidity > 80 contributes
        1.5 * max(0, (wind - 8) / 10) +       # wind > 8 contributes
        1.0 * max(0, (30 - temp) / 10) +      # cooler temp is positive signal
        1.0 * max(0, (3 - uv) / 3)            # low UV (cloudy/rainy)
    )

    # Monsoon Peak: moderate precip + high humidity + warm temp + moderate wind
    scores["Monsoon Peak"] = (
        2.0 * max(0, (humidity - 70) / 20) +  # humidity > 70 contributes
        1.5 * min(precip / 1.0, 2.0) +        # some precipitation
        1.5 * max(0, (temp - 26) / 5) +       # warm (above 26)
        1.0 * max(0, (apparent - 28) / 5) +   # feels hot
        0.5 * max(0, (wind - 5) / 10) -       # some wind
        2.0 * max(0, precip / 3.0 - 1.0)      # penalize very high precip (that's Heavy Monsoon)
    )

    # Pre-Monsoon Heat: high temp + low humidity + low precip + high UV
    scores["Pre-Monsoon Heat"] = (
        2.5 * max(0, (temp - 28) / 5) +       # temp > 28 is key
        2.0 * max(0, (80 - humidity) / 20) +   # low humidity is key
        1.5 * max(0, (uv - 3) / 7) +          # high UV
        1.5 * max(0, (apparent - 30) / 5) +    # high apparent temp
        1.0 * max(0, (0.5 - precip) / 0.5)    # very low precipitation
    )

    # Mild Overcast: cool temp + high humidity + low precip + low UV
    scores["Mild Overcast"] = (
        2.0 * max(0, (28 - temp) / 5) +       # cool temp below 28
        1.5 * max(0, (humidity - 80) / 15) +   # high humidity
        1.5 * max(0, (3 - uv) / 3) +          # low UV (overcast)
        1.0 * max(0, (0.5 - precip) / 0.5) +  # low precip (not raining much)
        0.5 * max(0, (28 - apparent) / 5)      # comfortable apparent temp
    )

    # Return the label with the highest composite score
    return max(scores, key=scores.get)


def run_kmeans(df: pd.DataFrame) -> dict:
    """
    Run K-Means clustering on the historical data with fixed K=4.
    Saves fitted model and scaler to disk via joblib.

    Returns:
        {
            "n_clusters": 4,
            "clusters": [{"label": str, "center": dict, "count": int, "stats": dict}],
            "points": [{"recorded_at": str, "cluster": int, ...features}],
        }
    """
    X = df[CLUSTER_FEATURES].fillna(0)
    if X.empty:
        return {"n_clusters": 0, "clusters": [], "points": []}

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    km = KMeans(n_clusters=N_CLUSTERS, random_state=42, n_init=10)
    labels = km.fit_predict(X_scaled)

    # Save fitted models to disk for prediction without re-fitting
    joblib.dump(km, KMEANS_MODEL_PATH)
    joblib.dump(scaler, SCALER_MODEL_PATH)
    print(f"[clustering] Saved KMeans model to {KMEANS_MODEL_PATH}")
    print(f"[clustering] Saved StandardScaler to {SCALER_MODEL_PATH}")

    # Inverse-transform centers back to original scale
    centers_scaled = km.cluster_centers_
    centers_original = scaler.inverse_transform(centers_scaled)

    # Build cluster metadata
    valid_indices = X.index.tolist()
    df_valid = df.loc[valid_indices].copy()
    df_valid["cluster"] = labels

    clusters = []
    for i in range(N_CLUSTERS):
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
        "n_clusters": N_CLUSTERS,
        "clusters": clusters,
        "points": points,
    }


def load_saved_models():
    """Load previously saved KMeans model and scaler from disk. Returns (km, scaler) or (None, None)."""
    if not os.path.exists(KMEANS_MODEL_PATH) or not os.path.exists(SCALER_MODEL_PATH):
        return None, None
    try:
        km = joblib.load(KMEANS_MODEL_PATH)
        scaler = joblib.load(SCALER_MODEL_PATH)
        return km, scaler
    except Exception as e:
        print(f"[clustering] Failed to load saved models: {e}")
        return None, None


def get_cluster_labels() -> dict:
    """Get a mapping of cluster_id -> label. Requires running get_cluster_results first."""
    results = get_cluster_results()
    if "error" in results:
        return {}
    return {c["id"]: c["label"] for c in results.get("clusters", [])}


def get_cluster_results() -> dict:
    """High-level function: load data -> cluster -> return results."""
    df = load_historical_data()
    if df.empty:
        return {"error": "No historical data found. Run historical_fetch.py first."}
    return run_kmeans(df)


def get_elbow_results() -> list:
    """High-level function: load data -> run elbow -> return inertia values."""
    df = load_historical_data()
    if df.empty:
        return []
    return run_elbow_method(df)


def get_scatter_data(sample: int = None) -> dict:
    """
    Get scatter-plot-ready data points.
    Optionally randomly samples to keep the frontend fast for large datasets.
    """
    results = get_cluster_results()
    if "error" in results:
        return {}

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


def get_pca_data(sample: int = None) -> dict:
    """
    Run PCA with 3 components on the clustered historical data.
    Returns PC1, PC2, PC3 per data point plus explained variance ratios.
    """
    from sklearn.decomposition import PCA

    results = get_cluster_results()
    if "error" in results:
        return {"error": results["error"]}

    df = load_historical_data()
    if df.empty:
        return {"error": "No historical data"}

    X = df[CLUSTER_FEATURES].fillna(0)
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # Fit PCA with 3 components
    pca = PCA(n_components=3, random_state=42)
    X_pca = pca.fit_transform(X_scaled)

    # Get explained variance ratios as percentages
    variance = [round(float(v * 100), 1) for v in pca.explained_variance_ratio_]

    # Get cluster labels from the fitted model
    km_model, km_scaler = load_saved_models()
    if km_model is None:
        return {"error": "No fitted model. Run /clusters first."}

    labels = km_model.predict(km_scaler.transform(X))
    cluster_labels = get_cluster_labels()

    points = []
    for i in range(len(X_pca)):
        cluster_id = int(labels[i])
        points.append({
            "pc1": round(float(X_pca[i][0]), 4),
            "pc2": round(float(X_pca[i][1]), 4),
            "pc3": round(float(X_pca[i][2]), 4),
            "cluster": cluster_id,
            "cluster_label": cluster_labels.get(cluster_id, f"Cluster {cluster_id}"),
        })

    # Random sample for performance
    if sample and sample < len(points):
        rng = np.random.default_rng(42)
        indices = rng.choice(len(points), size=sample, replace=False)
        points = [points[i] for i in sorted(indices)]

    return {
        "variance": variance,
        "n_clusters": results["n_clusters"],
        "clusters": results["clusters"],
        "points": points,
    }
