console.log("🧪 Test content script loaded");

function blurToxic() {
  const comments = Array.from(document.querySelectorAll(".comment"))
    .map(el => el.textContent.trim());

  if (comments.length === 0) {
    console.warn("⚠️ No .comment elements found");
    return;
  }

  console.log("📤 Sending comments to background:", comments);

  chrome.runtime.sendMessage(
    { type: "analyze", texts: comments },
    (response) => {
      if (!response || !response.ok) {
        console.error("❌ Error from background:", response);
        return;
      }

      console.log("✅ Predictions:", response.predictions);

      const commentEls = document.querySelectorAll(".comment");
      commentEls.forEach((el, i) => {
        if (response.predictions[i] === "TOXIC") {
          el.style.filter = "blur(6px)";
          el.style.transition = "filter 0.3s";
        }
      });
    }
  );
}


// 🔥 Auto-run after page loads
setTimeout(() => {
  console.log("🚀 Auto-triggering blurToxic()");
  blurToxic();
}, 1000);
