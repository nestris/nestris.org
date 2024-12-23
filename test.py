#!/usr/bin/env python3

import requests

def main():
    url = "http://localhost/api/v2/game/008256d5-d3c2-4687-9a5c-2ab04402ca33/1"
    
    try:
        response = requests.post(url)
        # Print the entire response body (as text)
        print(response.text)
    except requests.exceptions.RequestException as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    main()
