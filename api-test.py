import requests

message = """Server announcement:
The server will be going down for maintenance in 5 minutes."""

# Define the URL and the payload
url = "http://localhost:3000/api/broadcast-announcement"
payload = {
    "message": message,
    "password": "password"
}

# Make a POST request to the specified URL with the payload
response = requests.post(url, json=payload)

# Print the status code and the response text
print("Status Code:", response.status_code)
print("Response Text:", response.text)
