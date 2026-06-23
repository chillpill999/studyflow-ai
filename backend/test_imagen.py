import httpx
import json

API_KEY = "AIzaSyAMfJrXFNxOvyoXEMyxkRl5asZgoFINqiE"
URL = f"https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-fast-generate-001:predict?key={API_KEY}"

def generate_image(prompt):
    payload = {
        "instances": [{"prompt": prompt}],
        "parameters": {
            "sampleCount": 1,
            "outputOptions": {
                "mimeType": "image/jpeg"
            }
        }
    }
    response = httpx.post(URL, json=payload, headers={"Content-Type": "application/json"})
    print(response.status_code)
    try:
        data = response.json()
        if "predictions" in data:
            print("SUCCESS! Got image bytes length:", len(data["predictions"][0].get("bytesBase64Encoded", "")))
        else:
            print("Response:", data)
    except Exception as e:
        print("Error:", e, response.text)

generate_image("A cute dog in the snow")
