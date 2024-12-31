import requests
import time

def main():
    url = "http://localhost:4500/top-moves-hybrid?board=00000000000000000000000000000000000000000000000000000000000000000011100000001110000000111100000111110000011110000011111100011101110011101110001111111000111111100111111110011111111001111111101111111110&currentPiece=2&nextPiece=4&depth=1&playoutCount=7"
    
    start_time = time.time()
    response = requests.get(url)
    end_time = time.time()
    
    elapsed_time = end_time - start_time
    
    print(f"Status code: {response.status_code}")
    print(f"Response: {response.text}")
    print(f"Time taken (seconds): {elapsed_time:.4f}")

if __name__ == "__main__":
    main()
