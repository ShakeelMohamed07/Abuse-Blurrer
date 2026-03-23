// background.js
console.log("🧠 Toxic Comment Blurrer background service worker loaded.");

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "analyze") {
    console.log("🧩 Received texts for analysis:", message.texts.length);

    // ✅ Updated to use your ngrok public URL
    fetch("http://127.0.0.1:5000/analyze", {

    

      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true"
      },
      body: JSON.stringify({ texts: message.texts }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`HTTP ${res.status}: ${text}`);
        }
        return res.json();
      })
      .then((data) => {
        console.log("✅ Got predictions from backend:", data);
        sendResponse({ ok: true, predictions: data.predictions });
      })
      .catch((err) => {
        console.error("❌ Backend fetch failed:", err);
        sendResponse({ ok: false, error: err.message });
      });

    return true; // keeps message channel open for async reply
  }
});
