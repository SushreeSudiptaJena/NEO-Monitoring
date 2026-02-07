import os
import requests
from dotenv import load_dotenv

# Load .env file
load_dotenv()

# Get NASA API key from environment
NASA_API_KEY = os.getenv("NASA_API_KEY", "DEMO_KEY")

NASA_URL = "https://api.nasa.gov/neo/rest/v1/feed"
NASA_LOOKUP_URL = "https://api.nasa.gov/neo/rest/v1/neo"

def fetch_neo_data(start_date, end_date):
    params = {
        "start_date": start_date,
        "end_date": end_date,
        "api_key": NASA_API_KEY
    }

    response = requests.get(NASA_URL, params=params, timeout=15)
    response.raise_for_status()
    return response.json()


def fetch_neo_lookup(neo_id: str):
    response = requests.get(
        f"{NASA_LOOKUP_URL}/{neo_id}",
        params={"api_key": NASA_API_KEY},
        timeout=15,
    )
    response.raise_for_status()
    return response.json()
