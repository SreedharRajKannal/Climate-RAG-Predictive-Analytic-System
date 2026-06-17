import requests
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

try:
    print("Testing HTTPS with verify=False:")
    res = requests.get("https://api.open-meteo.com/v1/forecast?latitude=8.5241&longitude=76.9366&current=temperature_2m", verify=False, timeout=5)
    print("HTTPS Success:", res.status_code, res.json())
except Exception as e:
    print("HTTPS Failed:", e)
