import json
import urllib.request
import sys

BASE_URL = "http://localhost:8080/actuator/metrics"

metric_names = [
    "http.server.requests",
    "evaluation.service.latency",
    "evaluation.env.lookup",
    "evaluation.redis.lookup",
    "evaluation.rollout.eval",
    "evaluation.cache.hit",
    "evaluation.cache.miss",
    "tomcat.threads.busy",
    "tomcat.threads.config.max",
    "hikaricp.connections.active",
    "hikaricp.connections.idle",
    "hikaricp.connections.pending",
    "process.cpu.usage",
    "jvm.memory.used"
]

def fetch_metric(name):
    url = f"{BASE_URL}/{name}"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Python-Metrics-Collector'})
        with urllib.request.urlopen(req) as resp:
            if resp.status == 200:
                return json.loads(resp.read().decode('utf-8'))
    except Exception as e:
        return {"error": str(e)}
    return None

def collect_all():
    results = {}
    for m in metric_names:
        data = fetch_metric(m)
        if data and "measurements" in data:
            meas = {item["statistic"]: item["value"] for item in data["measurements"]}
            results[m] = meas
        else:
            results[m] = data
    return results

if __name__ == "__main__":
    snapshot = collect_all()
    print(json.dumps(snapshot, indent=2))
