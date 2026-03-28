import os, shutil, random

BASE    = 'D:/ml project/New folder/dataset'
DATASET = f'{BASE}/final'

# Clear existing final dataset
print("Clearing old dataset...")
for split in ['train', 'val', 'test']:
    for cls in ['genuine', 'manipulated']:
        folder = f'{DATASET}/{split}/{cls}'
        for f in os.listdir(folder):
            os.remove(os.path.join(folder, f))
print("✅ Cleared")

# Collect all images
genuine     = os.listdir(f'{BASE}/genuine')
synthetic   = os.listdir(f'{BASE}/manipulated/synthetic')
ai_fakes    = os.listdir(f'{BASE}/manipulated/ai_generated')

# Combine all manipulated
all_manip = (
    [(f, f'{BASE}/manipulated/synthetic') for f in synthetic] +
    [(f, f'{BASE}/manipulated/ai_generated') for f in ai_fakes]
)

print(f"Genuine:              {len(genuine)}")
print(f"Synthetic tampered:   {len(synthetic)}")
print(f"AI generated fakes:   {len(ai_fakes)}")
print(f"Total manipulated:    {len(all_manip)}")

# Balance classes
TARGET = min(len(genuine), len(all_manip))
genuine_sample = random.sample(genuine, TARGET)
manip_sample   = random.sample(all_manip, TARGET)

print(f"\nUsing {TARGET} images per class")

def split_genuine(files, src):
    random.shuffle(files)
    n = len(files)
    train_end = int(n * 0.70)
    val_end   = int(n * 0.85)
    splits = {
        'train': files[:train_end],
        'val':   files[train_end:val_end],
        'test':  files[val_end:]
    }
    for split, imgs in splits.items():
        for f in imgs:
            src_path = os.path.join(src, f)
            dst_path = f'{DATASET}/{split}/genuine/{f}'
            if os.path.exists(src_path):
                shutil.copy(src_path, dst_path)

def split_manip(files):
    random.shuffle(files)
    n = len(files)
    train_end = int(n * 0.70)
    val_end   = int(n * 0.85)
    splits = {
        'train': files[:train_end],
        'val':   files[train_end:val_end],
        'test':  files[val_end:]
    }
    for split, imgs in splits.items():
        for filename, src_dir in imgs:
            src_path = os.path.join(src_dir, filename)
            dst_path = f'{DATASET}/{split}/manipulated/{filename}'
            if os.path.exists(src_path):
                shutil.copy(src_path, dst_path)

split_genuine(genuine_sample, f'{BASE}/genuine')
split_manip(manip_sample)

print("\nFinal dataset counts:")
for split in ['train', 'val', 'test']:
    g = len(os.listdir(f'{DATASET}/{split}/genuine'))
    m = len(os.listdir(f'{DATASET}/{split}/manipulated'))
    print(f"  {split:6s} → genuine: {g:5d} | manipulated: {m:5d}")

print("\n✅ Dataset rebuilt and ready for training")