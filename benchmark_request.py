import requests
import time
from concurrent.futures import ThreadPoolExecutor

# URL and parameters
url = "http://localhost:4500/top-moves-hybrid"
params = {
    "board": "00000000000000000000000000000000000000000000000000000000000000000011100000001110000000111100000111110000011110000011111100011101110011101110001111111000111111100111111110011111111001111111101111111110",
    "currentPiece": "1"
}

# Function to send the request and measure the response time
def send_request(_):
    start_time = time.time()
    response = requests.get(url, params=params)
    request_time = time.time() - start_time
    return request_time

# Function to run the requests concurrently and measure time
def measure_time(N):
    request_times = []
    start_time = time.time()
    with ThreadPoolExecutor(max_workers=N) as executor:
        request_times = list(executor.map(send_request, range(N)))  # Sending requests concurrently
    end_time = time.time()
    
    total_time = end_time - start_time
    average_time_per_request = total_time / N
    return total_time, average_time_per_request, request_times

# Run and measure for N = 1, 5, 10, 20
for N in [1, 5, 10, 20]:
    total_time, average_time_per_request, request_times = measure_time(N)
    print(f"Time taken for {N} concurrent requests: {total_time:.4f} seconds")
    print(f"Average time per request: {average_time_per_request:.4f} seconds")
    print(f"Individual request times: {request_times}")
    print("-" * 50)
