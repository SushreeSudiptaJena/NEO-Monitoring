import os
import requests
from dotenv import load_dotenv

# Load .env file
load_dotenv()

# Get NASA API key from environment
NASA_API_KEY = os.getenv("NASA_API_KEY")

NASA_URL = "https://api.nasa.gov/neo/rest/v1/feed"

def fetch_neo_data(start_date, end_date):
    params = {
        "start_date": start_date,
        "end_date": end_date,
        "api_key": NASA_API_KEY
    }

    response = requests.get(NASA_URL, params=params)
    response.raise_for_status()
    return response.json()
