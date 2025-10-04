import requests
import os
from datetime import datetime
from pathlib import Path

def download_nasa_ocean_data(start_date, end_date, output_dir='./data'):
    """Download ocean data from NASA CMR API"""
    
    # CMR API endpoint
    base_url = "https://cmr.earthdata.nasa.gov/search/granules.json"
    
    # Collections that existed in 2020
    collections = [
        'MODIS_A-JPL-L2P-v2019.0',  # MODIS Aqua SST
        'VIIRS_NPP-OSPO-L2P-v2.61',  # VIIRS SST
    ]
    
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    results = []
    
    for collection in collections:
        print(f"\nSearching for {collection}...")
        
        params = {
            'short_name': collection,
            'temporal': f'{start_date},{end_date}',
            'page_size': 10,
        }
        
        response = requests.get(base_url, params=params)
        
        if response.status_code == 200:
            data = response.json()
            entries = data.get('feed', {}).get('entry', [])
            
            print(f"Found {len(entries)} granules")
            
            # Save metadata
            output_file = Path(output_dir) / f'{collection}_metadata.json'
            with open(output_file, 'w') as f:
                import json
                json.dump(entries, f, indent=2)
            
            results.append({
                'collection': collection,
                'count': len(entries),
                'metadata_file': str(output_file)
            })
        else:
            print(f"Error: {response.status_code}")
    
    return results

if __name__ == '__main__':
    start = '2020-06-10T11:52:20Z'
    end = '2020-06-17T11:52:20Z'
    
    print(f"Downloading NASA ocean data from {start} to {end}")
    results = download_nasa_ocean_data(start, end)
    
    print("\n=== Summary ===")
    for r in results:
        print(f"{r['collection']}: {r['count']} granules")
        print(f"  Metadata: {r['metadata_file']}")