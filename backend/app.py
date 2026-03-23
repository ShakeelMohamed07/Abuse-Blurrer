# backend/app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import os

app = Flask(__name__)

# ✅ Allow localhost + YouTube + Chrome extension
CORS(app, resources={r"/*": {"origins": ["*", "https://www.youtube.com", "chrome-extension://*"]}})

device = "cuda" if torch.cuda.is_available() else "cpu"

# ✅ Path to your fine-tuned model
model_path = os.path.join(os.path.dirname(__file__), "distilbert_abuse_detector_v2")
tokenizer = AutoTokenizer.from_pretrained(model_path, local_files_only=True)
model = AutoModelForSequenceClassification.from_pretrained(model_path, local_files_only=True)
model.to(device)
model.eval()

@app.after_request
def after_request(response):
    response.headers.add("Access-Control-Allow-Origin", "*")
    response.headers.add("Access-Control-Allow-Headers", "Content-Type,Authorization,ngrok-skip-browser-warning")
    response.headers.add("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS")
    response.headers.add("Access-Control-Allow-Credentials", "true")
    return response

# ✅ Renamed /predict → /analyze to match Chrome extension
@app.route("/analyze", methods=["POST"])
def analyze():
    data = request.json
    texts = data.get("texts", [])
    if not texts:
        return jsonify({"error": "No texts provided"}), 400

    encodings = tokenizer(texts, padding=True, truncation=True, max_length=128, return_tensors="pt")
    input_ids = encodings["input_ids"].to(device)
    attention_mask = encodings["attention_mask"].to(device)

    with torch.no_grad():
        outputs = model(input_ids=input_ids, attention_mask=attention_mask)
        preds = torch.argmax(outputs.logits, dim=-1)

    print("\n----- Comment Predictions -----")
    results = []
    for text, pred in zip(texts, preds.cpu().tolist()):
        label = "TOXIC" if pred == 1 else "CLEAN"
        print(f"{'🟥' if label == 'TOXIC' else '🟩'} {label} → {text[:100]}...")
        results.append(label)
    print("--------------------------------\n")

    return jsonify({"predictions": results})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
