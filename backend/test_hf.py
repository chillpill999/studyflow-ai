import httpx

URL = "https://api-inference.huggingface.co/models/prompthero/openjourney"

def generate_image(prompt):
    payload = {"inputs": prompt}
    response = httpx.post(URL, json=payload, headers={"Content-Type": "application/json"}, timeout=30.0)
    print(response.status_code)
    print(len(response.content))
    if response.status_code != 200:
        print(response.text)

generate_image("A cute dog in the snow")
