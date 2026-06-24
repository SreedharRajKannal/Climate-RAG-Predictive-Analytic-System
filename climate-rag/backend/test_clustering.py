"""Verify 4-cluster K-Means + model persistence."""
import sys, os
sys.path.append(os.path.dirname(__file__))

from clustering import get_cluster_results, load_saved_models

print("=== Running 4-Cluster K-Means ===")
r = get_cluster_results()
print(f"Clusters: {r['n_clusters']}")
for c in r['clusters']:
    print(f"  {c['id']}: {c['label']} ({c['count']} rows)")
    print(f"     center: temp={c['center']['temperature']}, hum={c['center']['humidity']}, precip={c['center']['precipitation']}")

print(f"\nModel file exists: {os.path.exists('kmeans_model.pkl')}")
print(f"Scaler file exists: {os.path.exists('kmeans_scaler.pkl')}")

print("\n=== Testing load_saved_models ===")
km, scaler = load_saved_models()
print(f"KMeans loaded: {km is not None}")
print(f"Scaler loaded: {scaler is not None}")
if km:
    print(f"KMeans n_clusters: {km.n_clusters}")
