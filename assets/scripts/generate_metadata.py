# scripts/generate_metadata.py
import json, glob, os

frames = sorted(glob.glob("../data_processed/frames/*.png"))

metadata = {
    "dataset": "NASA PACE + SWOT Visualization",
    "frame_rate": 24,
    "frames": [{"file": os.path.basename(f), "index": i} for i, f in enumerate(frames)],
    "notes": "EXR converted to PNG, downsampled for VR."
}

with open("../data_processed/metadata.json", "w") as f:
    json.dump(metadata, f, indent=2)

print("metadata.json created.")
