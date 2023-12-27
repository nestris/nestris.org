import requests
import random
import time

# Function to generate a random board
def generate_random_board():
    return ''.join(random.choice(['0', '1']) for _ in range(200))

# Base URLs
url1 = "https://stackrabbit.herokuapp.com/engine-movelist"
url2 = "http://24.144.70.115:3000/engine-movelist"

# Fixed parameters
params = {
    "currentPiece": "J",
    "level": "18",
    "lines": "110",
    "inputFrameTimeline": "X....."
}

# To store the total response time for each API
total_time_api1 = 0
total_time_api2 = 0

# Number of API calls
num_calls = 10

# Making API calls and measuring response time
for _ in range(num_calls):
    # Generate a random board
    board = generate_random_board()
    params['board'] = board

    # Measure response time for API 1
    start_time = time.time()
    response = requests.get(url1, params=params)
    print("heroku", response)
    total_time_api1 += time.time() - start_time

    # Measure response time for API 2
    start_time = time.time()
    response = requests.get(url2, params=params)
    print("do", response)
    total_time_api2 += time.time() - start_time

# Calculating the average response time
avg_time_api1 = total_time_api1 / num_calls
avg_time_api2 = total_time_api2 / num_calls

print(f"Average Response Time for API 1 (stackrabbit.herokuapp.com): {avg_time_api1:.4f} seconds")
print(f"Average Response Time for API 2 (24.144.70.115:3000): {avg_time_api2:.4f} seconds")


