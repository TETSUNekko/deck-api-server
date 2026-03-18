import json
import os

# 每種類型需要的欄位
SCHEMA_RULES = {
    "Member": ["id", "type", "name", "imageFolder", "color", "grade",
               "searchKeywords", "versions", "tags", "effectType"],
    "Oshi": ["id", "type", "name", "imageFolder", "color",
             "searchKeywords", "versions", "tags", "hp"],
    "Support": ["id", "type", "name", "imageFolder",
                "searchKeywords", "versions", "tags"],
    "Event": ["id", "type", "name", "imageFolder",
              "searchKeywords", "versions", "tags"],
    "Energy": ["id", "type", "name", "imageFolder", "versions"]
}

# 🔧 在這裡設定要檢查的檔案
#   - 如果填 None，會檢查 ./src 資料夾下所有 cardList_*.json
#   - 如果要只檢查單一檔案，就把檔名改在這裡
CARD_DATA_PATH = "cardList_hBP05.json"  # 或改成 None

# 預設卡表 JSON 資料夾
CARD_FOLDER = "."


def check_card_schema():
    results = []
    files_to_check = []

    if CARD_DATA_PATH:
        filepath = os.path.join(CARD_FOLDER, CARD_DATA_PATH)
        if os.path.isfile(filepath):
            files_to_check.append(filepath)
        else:
            print(f"❌ 找不到檔案: {filepath}")
            return []
    else:
        files_to_check = [
            os.path.join(CARD_FOLDER, f)
            for f in os.listdir(CARD_FOLDER)
            if f.startswith("cardList_") and f.endswith(".json")
        ]

    for filepath in files_to_check:
        with open(filepath, "r", encoding="utf-8") as f:
            try:
                cards = json.load(f)
            except json.JSONDecodeError as e:
                results.append((filepath, f"JSON 解析錯誤: {e}"))
                continue

        for card in cards:
            card_type = card.get("type")
            required_fields = SCHEMA_RULES.get(card_type)

            if not required_fields:
                results.append((card.get("id", "未知ID"), f"未知的 type: {card_type}"))
                continue

            # 檢查必填欄位
            for field in required_fields:
                if field not in card:
                    results.append((card.get("id", "未知ID"), f"缺少必填欄位: {field}"))
                elif field != "effectType" and card[field] in [None, "", []]:
                    results.append((card.get("id", "未知ID"), f"欄位 {field} 不可為空"))


            # 額外規則：Member 且 grade=2nd → 必須有 "特功"
            if card_type == "Member" and card.get("grade") == "2nd":
                if "特功" not in card or card["特功"] in [None, "", []]:
                    results.append((card.get("id", "未知ID"), "grade=2nd 時缺少欄位: 特功"))

    return results


if __name__ == "__main__":
    results = check_card_schema()

    if results:
        print("⚠️ 檢查到問題：")
        for cid, issue in results:
            print(f"- {cid}: {issue}")
    else:
        print("✅ 所有卡片資料結構完整")
