import cv2, glob, os

input_dir = "../data_raw/exr"
output_dir = "../data_processed/frames"
os.makedirs(output_dir, exist_ok=True)

for i, f in enumerate(sorted(glob.glob(f"{input_dir}/*.exr"))):
  img = cv2.imread(f, cv2.IMREAD_UNCHANGED)

  h, w = img.shape[:2]
  scale = min(4096 / w, 1.0)
  resized = cv2.resize(img, (int(w*scale), int(h*scale)))
  out_file = os.path.join(output_dir, f"frame_{i:0.5d}.png")
  cv2.imwrite(out_file, resized)
  print(f"Saved {out_file}")
