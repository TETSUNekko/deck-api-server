import os
import json

# 🔧 載入卡片資料 JSON（請換成你要檢查的 JSON 路徑）
CARD_DATA_PATH = 'cardList_PR.json'

# ✅ 讀取卡片資料
with open(CARD_DATA_PATH, 'r', encoding='utf-8') as f:
    card_data = json.load(f)

expected_images = set()
found_images = set()
image_folder_map = {}  # 為了反查 folder

# 🔍 建立應有的圖片檔名清單
for card in card_data:
    card_id = card.get('id')
    versions = card.get('versions', [])
    folder = card.get('imageFolder', '').strip('/')

    for ver in versions:
        filename = f"{card_id}{ver}".replace('.png', '')  # 移除副檔名方便比對
        expected_images.add(f"{filename}")
        image_folder_map[filename] = folder

# 🔍 搜尋所有圖片檔案實際存在的圖
for folder in set(image_folder_map.values()):
    folder_path = os.path.join('C:/Users/Johna/Desktop/holotcg-online/client/public/cards', folder)
    if not os.path.exists(folder_path):
        print(f"[⚠] 圖片資料夾不存在：{folder_path}")
        continue

    for fname in os.listdir(folder_path):
        if fname.endswith('.png'):
            name = os.path.splitext(fname)[0]  # 移除副檔名
            found_images.add(name)

# ✅ 檢查缺少圖片的卡片
missing_images = expected_images - found_images
extra_images = found_images - expected_images

print("\n========== ✅ 檢查結果 ==========\n")

if missing_images:
    print("❌ 缺少圖片檔案（有資料但沒圖）：")
    for name in sorted(missing_images):
        print(f"  - {name}.png")
else:
    print("✅ 所有卡片圖檔皆存在！")

print("\n-----------------------------\n")

if extra_images:
    print("❌ 找到多餘圖片檔案（有圖但沒資料）：")
    for name in sorted(extra_images):
        print(f"  - {name}.png")
else:
    print("✅ 所有圖片皆有對應卡片資料！")

print("\n===============================\n")
