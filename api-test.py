import requests

# write a python program that goes to POST http://localhost:3000/api/v2/set-feedback
# with body id = 01b9815a-85fe-4423-9244-95af0f2b78d4 username = ansel feedback = like value = true


url = 'http://localhost:3000/api/v2/set-feedback'
myobj = {'id': '00145805-a2b9-4237-a3ec-77cfb8d14aa9', 
          'username': 'test', 
          'feedback': 'liked', 
          'value': 'false'}

print(requests.post(url, json = myobj).text)