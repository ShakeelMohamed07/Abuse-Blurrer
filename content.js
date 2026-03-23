console.log("🟢 YouTube Toxic Blurrer running");

let isBlurred = false;

// Floating button
const btn = document.createElement("button");
btn.innerText = "Blur Toxic Comments";
btn.style.position = "fixed";
btn.style.bottom = "20px";
btn.style.right = "20px";
btn.style.zIndex = "9999";
btn.style.padding = "12px 20px";
btn.style.background = "#6a5acd";
btn.style.color = "#fff";
btn.style.border = "none";
btn.style.borderRadius = "8px";
btn.style.cursor = "pointer";
btn.style.fontSize = "14px";

document.body.appendChild(btn);

btn.onclick = () => {
  const comments = document.querySelectorAll("#content-text");

  // UNBLUR
  if (isBlurred) {
    comments.forEach(c => c.style.filter = "none");
    btn.innerText = "Blur Toxic Comments";
    isBlurred = false;
    return;
  }

  // GET TEXTS
  const texts = Array.from(comments).map(c =>
    c.innerText.trim()
  );

  chrome.runtime.sendMessage(
    { type: "analyze", texts },
    (response) => {
      if (!response || !response.ok) return;

      comments.forEach((c, i) => {
        if (response.predictions[i] === "TOXIC") {
          c.style.filter = "blur(6px)";
        }
      });

      btn.innerText = "Unblur Toxic Comments";
      isBlurred = true;
    }
  );
};
