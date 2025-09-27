# scripts/extract_frames_from_mp4.py
import imageio.v3 as iio
import os

video_path = "./assets/data_raw/mp4/video.mp4"   # adjust filename
output_dir = "./assets/data_processed/frames"
os.makedirs(output_dir, exist_ok=True)

print("Looking for:", os.path.abspath(video_path))
print("Exists?", os.path.exists(video_path))

# Target fps for extraction
target_fps = 10

# Get video metadata
meta = iio.immeta(video_path, exclude_applied=False)
source_fps = round(meta["fps"])
print(f"Source FPS: {source_fps}, Target FPS: {target_fps}")

stride = max(1, source_fps // target_fps)

frames = iio.imiter(video_path)

for i, frame in enumerate(frames):
    if i % stride != 0:
        continue
    out_file = os.path.join(output_dir, f"video_frame_{i:05d}.png")
    iio.imwrite(out_file, frame)
    if i % (stride * 10) == 0:  # status update every ~1s worth of frames
        print(f"Saved frame {i}")

print(f"✅ Frames saved to {output_dir} (every {stride}th frame)")
