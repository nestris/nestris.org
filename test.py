import requests
import time

def main():
    url = "http://localhost:3002/engine?board=00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000100000010111111011011111101111111110111111111011111111101111111110&level=18&lines=0&currentPiece=Z&nextPiece=J&inputFrameTimeline=X.&lookaheadDepth=0"
    
    start_time = time.time()
    response = requests.get(url)
    end_time = time.time()
    
    elapsed_time = end_time - start_time
    
    print(f"Status code: {response.status_code}")
    print(f"Response: {response.text}")
    print(f"Time taken (seconds): {elapsed_time:.4f}")

if __name__ == "__main__":
    main()
