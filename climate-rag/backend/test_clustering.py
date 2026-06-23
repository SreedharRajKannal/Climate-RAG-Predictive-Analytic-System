"""Quick test for the clustering engine."""
import sys, os
sys.path.append(os.path.dirname(__file__))

from clustering import get_cluster_results, get_elbow_results

print("=== Elbow Method ===")
elbow = get_elbow_results()
for e in elbow:
    print(f"  K={e['k']}: inertia={e['inertia']}")

print("\n=== Cluster Results ===")
result = get_cluster_results()
print(f"Optimal K: {result['n_clusters']}")
print(f"Total points: {len(result['points'])}")

for c in result["clusters"]:
    print(f"\n  Cluster {c['id']}: {c['label']}")
    print(f"    Records: {c['count']}")
    print(f"    Avg Temp: {c['center']['temperature']} C")
    print(f"    Avg Humidity: {c['center']['humidity']}%")
    print(f"    Avg Precip: {c['center']['precipitation']} mm")
    print(f"    Avg Wind: {c['center']['wind_speed']} km/h")
    print(f"    Avg UV: {c['center']['uv_index']}")
