console.log("🧪 Final placement test script loaded");

let isBlurred = false;

/* ===== Styles ===== */
const style = document.createElement("style");
style.innerHTML = `
  body {
    font-family: "Inter", "Segoe UI", system-ui, sans-serif;
    background: linear-gradient(180deg, #f6f7ff, #ffffff);
  }

  .comment {
    background: #ffffff;
    border-radius: 14px;
    padding: 14px 18px;
    margin: 12px auto;
    max-width: 900px;
    box-shadow: 0 6px 16px rgba(0,0,0,0.08);
    transition: filter 0.35s ease;
  }

  .btn-wrapper {
    display: flex;
    justify-content: center;
    margin: 36px 0 60px 0;
  }

  .toxic-toggle-btn {
    padding: 14px 34px;
    font-size: 15px;
    font-weight: 600;
    border-radius: 999px;
    border: none;
    cursor: pointer;
    color: white;
    background: linear-gradient(135deg, #7b5cff, #5f2eea);
    box-shadow: 0 14px 30px rgba(95,46,234,0.35);
    transition: all 0.3s ease;
  }

  .toxic-toggle-btn:hover {
    transform: translateY(-2px) scale(1.03);
    box-shadow: 0 18px 38px rgba(95,46,234,0.45);
  }

  .toxic-toggle-btn.unblur {
    background: linear-gradient(135deg, #ff4d4d, #ff0000);
    box-shadow: 0 14px 30px rgba(255,0,0,0.35);
  }
`;
document.head.appendChild(style);

/* ===== Create Button ===== */
const btnWrapper = document.createElement("div");
btnWrapper.className = "btn-wrapper";

const toggleBtn = document.createElement("button");
toggleBtn.className = "toxic-toggle-btn";
toggleBtn.innerText = "Blur Toxic Comments";

btnWrapper.appendChild(toggleBtn);

/* ===== INSERT BUTTON BELOW COMMENTS ===== */
const comments = document.querySelectorAll(".comment");
if (comments.length > 0) {
  comments[comments.length - 1].after(btnWrapper);
} else {
  document.body.appendChild(btnWrapper);
}

/* ===== Toggle Logic ===== */
toggleBtn.onclick = () => {
  const commentEls = document.querySelectorAll(".comment");

  // UNBLUR
  if (isBlurred) {
    commentEls.forEach(el => (el.style.filter = "none"));
    toggleBtn.innerText = "Blur Toxic Comments";
    toggleBtn.classList.remove("unblur");
    isBlurred = false;
    return;
  }

  // BLUR
  const texts = Array.from(commentEls).map(el => el.innerText.trim());

  chrome.runtime.sendMessage(
    { type: "analyze", texts },
    response => {
      if (!response || !response.ok) return;

      commentEls.forEach((el, i) => {
        if (response.predictions[i] === "TOXIC") {
          el.style.filter = "blur(6px)";
        }
      });

      toggleBtn.innerText = "Unblur Toxic Comments";
      toggleBtn.classList.add("unblur");
      isBlurred = true;
    }
  );
};

