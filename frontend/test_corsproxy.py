import requests

url = "https://corsproxy.io/?url=https://httpbin.org/headers"
headers = {"Authorization": "Bearer TEST_KEY"}
res = requests.get(url, headers=headers)
print(res.text)
