import requests

# write a python program that goes to POST http://localhost:3000/api/v2/simulate-game&count=10

url = "http://localhost:3000/api/v2/simulate-game?count=20"
response = requests.post(url)
print(response.text)