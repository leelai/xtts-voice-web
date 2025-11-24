# AI 語音生成器 - Coqui XTTS-v2

這是一個基於 Coqui XTTS-v2 的文字轉語音應用程式，提供現代化的網頁界面讓用戶輸入文字並生成高品質語音。

## 功能特色

- 🎙️ **高品質語音生成**：使用 Coqui XTTS-v2 模型
- 🌍 **多語言支援**：支援中文、英文、日文、韓文等多種語言
- 🎨 **現代化介面**：漸層設計、玻璃擬態效果、流暢動畫
- 🔊 **即時播放**：生成後立即播放語音
- 💾 **音訊下載**：可下載生成的語音檔案

## 系統需求

- Python 3.8 或更高版本
- 建議至少 8GB VRAM 的顯示卡（可在較低配置下運行，但速度較慢）
- 首次運行會自動下載模型檔案（約 2GB）

## 安裝步驟

1. **創建並啟動虛擬環境**：
```bash
cd /Users/leelai/.gemini/antigravity/scratch/tts-xtts-v2
python3 -m venv venv
source venv/bin/activate  # macOS/Linux
```

2. **安裝依賴**：
```bash
pip install -r requirements.txt
```

3. **啟動應用**：
```bash
python app.py
```

4. **訪問應用**：
打開瀏覽器訪問 `http://localhost:5000`

## 使用說明

1. 在文字輸入框中輸入要轉換的文字
2. 選擇目標語言
3. 點擊「生成語音」按鈕
4. 等待生成完成（首次使用會下載模型）
5. 自動播放生成的語音
6. 可選擇下載音訊檔案

## 技術棧

- **後端**：Flask, Coqui TTS
- **前端**：HTML5, CSS3, JavaScript
- **模型**：XTTS-v2 (multilingual/multi-dataset)
- **AI**：PyTorch

## 專案結構

```
tts-xtts-v2/
├── app.py                 # Flask 伺服器
├── requirements.txt       # Python 依賴
├── static/
│   ├── css/
│   │   └── style.css     # 樣式檔案
│   ├── js/
│   │   └── app.js        # 前端邏輯
│   └── audio/            # 生成的音訊檔案
├── templates/
│   └── index.html        # 主頁面
└── README.md             # 說明文件
```

## 注意事項

- 首次運行需要下載模型，請確保網路連接穩定
- 生成的音訊檔案會自動清理（超過 1 小時的舊檔案）
- 長文字生成可能需要較長時間

## 授權

此專案使用 Coqui TTS，請遵守相關授權條款。

## 貢獻

歡迎提交 Issue 和 Pull Request！
