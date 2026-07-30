import time
import statistics
from concurrent.futures import ThreadPoolExecutor, as_completed
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

# Login to get authorization header
login_res = client.post("/api/v1/auth/login", json={"email": "admin@brokeros.com", "password": "Admin@123"})
assert login_res.status_code == 200, f"Login failed: {login_res.text}"
token = login_res.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

ENDPOINTS = [
    ("Root Health", "GET", "/", None),
    ("Auth Me", "GET", "/api/v1/auth/me", headers),
    ("Leads List", "GET", "/api/v1/leads", headers),
    ("Builders List", "GET", "/api/v1/builders", headers),
    ("Projects List", "GET", "/api/v1/projects", headers),
    ("Bookings List", "GET", "/api/v1/bookings", headers),
    ("Commissions List", "GET", "/api/v1/commissions", headers),
    ("Dashboard Stats", "GET", "/api/v1/reports/dashboard-stats", headers),
    ("Monthly Sales", "GET", "/api/v1/reports/monthly-sales", headers),
]

def make_request(endpoint):
    name, method, path, req_headers = endpoint
    start = time.perf_counter()
    if method == "GET":
        res = client.get(path, headers=req_headers)
    elif method == "POST":
        res = client.post(path, headers=req_headers)
    elapsed = (time.perf_counter() - start) * 1000  # in ms
    return name, res.status_code, elapsed

def run_performance_test(total_requests=500, concurrency=25):
    print("=" * 65)
    print(f"[BENCHMARK] STARTING BACKEND PERFORMANCE & LOAD TEST")
    print(f"            Total Requests: {total_requests} | Concurrency: {concurrency}")
    print("=" * 65)

    all_latencies = []
    status_codes = {}
    endpoint_stats = {name: [] for name, _, _, _ in ENDPOINTS}

    start_total = time.perf_counter()

    with ThreadPoolExecutor(max_workers=concurrency) as executor:
        futures = []
        for i in range(total_requests):
            ep = ENDPOINTS[i % len(ENDPOINTS)]
            futures.append(executor.submit(make_request, ep))

        for future in as_completed(futures):
            name, status, elapsed = future.result()
            status_codes[status] = status_codes.get(status, 0) + 1
            all_latencies.append(elapsed)
            endpoint_stats[name].append(elapsed)

    total_duration = time.perf_counter() - start_total
    rps = total_requests / total_duration

    print(f"\nSUMMARY RESULTS:")
    print(f"   Total Duration: {total_duration:.2f} seconds")
    print(f"   Throughput:     {rps:.2f} requests/sec (RPS)")
    print(f"   Success Rate:   {(status_codes.get(200, 0) / total_requests) * 100:.1f}% ({status_codes.get(200, 0)} / {total_requests} OK)")

    print(f"\nLATENCY METRICS (Overall):")
    print(f"   Min Latency:    {min(all_latencies):.2f} ms")
    print(f"   Average (Mean): {statistics.mean(all_latencies):.2f} ms")
    print(f"   Median (P50):   {statistics.median(all_latencies):.2f} ms")
    sorted_lat = sorted(all_latencies)
    p95 = sorted_lat[int(len(sorted_lat) * 0.95)]
    p99 = sorted_lat[int(len(sorted_lat) * 0.99)]
    print(f"   95th Percentile:{p95:.2f} ms")
    print(f"   99th Percentile:{p99:.2f} ms")
    print(f"   Max Latency:    {max(all_latencies):.2f} ms")

    print(f"\nBREAKDOWN BY ENDPOINT:")
    print(f"   {'Endpoint':<20} | {'Reqs':<5} | {'Avg (ms)':<9} | {'P95 (ms)':<9} | {'Max (ms)':<9}")
    print("   " + "-" * 60)
    for name, lats in endpoint_stats.items():
        if lats:
            avg_l = statistics.mean(lats)
            s_l = sorted(lats)
            p95_l = s_l[int(len(s_l) * 0.95)]
            max_l = max(lats)
            print(f"   {name:<20} | {len(lats):<5} | {avg_l:<9.2f} | {p95_l:<9.2f} | {max_l:<9.2f}")

    print("=" * 65)

if __name__ == "__main__":
    run_performance_test(total_requests=500, concurrency=25)
