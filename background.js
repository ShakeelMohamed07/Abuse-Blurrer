console.log("🧠 Background running");

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "analyze") {
    fetch("http://127.0.0.1:5000/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ texts: msg.texts })
    })
      .then(res => res.json())
      .then(data => {
        sendResponse({ ok: true, predictions: data.predictions });
      })
      .catch(err => {
        sendResponse({ ok: false, error: err.message });
      });

    return true;
  }
});

