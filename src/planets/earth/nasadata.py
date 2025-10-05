import requests
import json
import os
from datetime import datetime

# NASA PODAAC API endpoint for ocean temperature data
PODAAC_API_URL = "https://podaac.jpl.nasa.gov/ws/search/dataset"
OCEAN_TEMP_DATASET = "MODIS_A-JPL-L2P-v2019.0"

def fetch_ocean_temp_data(date=None):
    # Use current date if none provided
    if not date:
        date = datetime.now().strftime("%Y-%m-%d")
        
    params = {
        "full": "true",
        "datasetId": OCEAN_TEMP_DATASET,
        "startTime": date,
        "endTime": date,
        "itemsPerPage": 1,
        "format": "json"
    }
    
    try:
        response = requests.get(PODAAC_API_URL, params=params)
        response.raise_for_status()
        data = response.json()
        
        # Save response to local file for debugging
        cache_dir = os.path.join(os.path.dirname(__file__), "cache")
        os.makedirs(cache_dir, exist_ok=True)
        
        with open(os.path.join(cache_dir, f"ocean_temp_{date}.json"), "w") as f:
            json.dump(data, f, indent=2)
            
        print(f"✅ Ocean temperature data fetched for {date}")
        return data
    
    except Exception as e:
        print(f"❌ Error fetching ocean temperature data: {e}")
        return None

def get_temperature_map_url():
    # NASA PODAAC Earth observation visualization
    # This provides a consistent URL for the global SST visualization
    # Fallback to cached image if API call fails
    return "https://podaac.jpl.nasa.gov/Podaac/thumbnails/MODIS_A-JPL-L2P-v2019.0.jpg"

def get_sst_anomaly_map_url():
    # SST anomaly shows temperature differences from normal
    return "https://www.star.nesdis.noaa.gov/pub/sod/mecb/crw/data/5km/v3.1/nc/climatology/monthly/sstanomaly/ex/2023/composite_ssta.png"

def get_temperature_visualization_urls():
    return {
        "sst": get_temperature_map_url(),
        "sst_anomaly": get_sst_anomaly_map_url(),
        "sst_local": "/assets/imgs/ocean_temp_map.jpg",
        "sst_anomaly_local": "/assets/imgs/ocean_temp_anomaly.jpg",
    }

# Initialize by fetching data (can be called when app starts)
if __name__ == "__main__":
    fetch_ocean_temp_data()