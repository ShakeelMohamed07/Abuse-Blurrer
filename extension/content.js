console.log("🟢 Toxic Comment Blurrer (YouTube API version) started...");

const YT_API_KEY = "AIzaSyCqzmM_VBgtDLct_lufmOrio8rZ9WNv1gE"; // ✅ Your YouTube API key

// Extract video ID from current URL
function getVideoId() {
  const match = window.location.href.match(/v=([^&]+)/);
  return match ? match[1] : null;
}

// Fetch comments using YouTube Data API
async function fetchYouTubeComments(videoId) {
  try {
    const url = `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&maxResults=50&videoId=${videoId}&key=${YT_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data.items) {
      console.warn("⚠️ No comment items returned from API:", data);
      return [];
    }

    const comments = data.items.map(
      item => item.snippet.topLevelComment.snippet.textDisplay
    );

    console.log(`📥 Fetched ${comments.length} comments from YouTube API.`);
    return comments;
  } catch (err) {
    console.error("❌ Error fetching comments:", err);
    return [];
  }
}

// Apply blur effect for toxic comments
function blurToxicComments(predictions) {
  // ✅ Broader selector set to catch all types of YouTube comment renderers
  const allCommentElements = [
    ...document.querySelectorAll("#content-text"),
    ...document.querySelectorAll("yt-attributed-string#content-text"),
    ...document.querySelectorAll("ytd-comment-renderer #content-text"),
  ];

  if (!allCommentElements.length) {
    console.warn("⚠️ Still no comment elements visible. Retrying in 2s...");
    setTimeout(() => blurToxicComments(predictions), 2000);
    return;
  }

  console.log(`💬 Found ${allCommentElements.length} comment elements — applying blur now.`);

  allCommentElements.forEach((comment, i) => {
    const pred = predictions[i];
    if (pred && pred.toUpperCase() === "TOXIC" && !comment.classList.contains("blurred")) {
      comment.style.filter = "blur(6px)";
      comment.style.transition = "filter 0.3s";
      comment.classList.add("blurred");

      // Add Unblur button
      const btn = document.createElement("button");
      btn.textContent = "Unblur";
      btn.style.marginLeft = "8px";
      btn.style.background = "#000";
      btn.style.color = "#fff";
      btn.style.border = "none";
      btn.style.padding = "3px 8px";
      btn.style.borderRadius = "6px";
      btn.style.cursor = "pointer";
      btn.style.fontSize = "12px";

      btn.onclick = () => {
        comment.style.filter = "none";
        btn.remove();
      };

      // ✅ Attach button to nearest visible comment container
      const parent = comment.closest("ytd-comment-renderer") || comment.parentElement;
      if (parent) parent.appendChild(btn);
    }
  });
}

// Main analyzer function
async function analyzeComments() {
  const videoId = getVideoId();
  if (!videoId) {
    console.log("🟡 No video ID detected, retrying...");
    setTimeout(analyzeComments, 2000);
    return;
  }

  console.log(`🎥 Detected video ID: ${videoId}`);
  const comments = await fetchYouTubeComments(videoId);

  if (!comments.length) {
    console.log("🟡 No comments fetched yet, retrying in 5s...");
    setTimeout(analyzeComments, 5000);
    return;
  }

  console.log(`📤 Sending ${comments.length} comments for toxicity prediction...`);

  chrome.runtime.sendMessage({ type: "analyze", texts: comments }, response => {
    if (!response) {
      console.error("❌ No response from background script!");
      return;
    }

    if (response.ok) {
      console.log("✅ Predictions received:", response.predictions);
      blurToxicComments(response.predictions);
    } else {
      console.error("❌ Prediction error:", response.error);
    }
  });
}

// Start analyzing when page loads
setTimeout(analyzeComments, 4000);

let lastAnalyzedTime = 0;

const observer = new MutationObserver(() => {
  const now = Date.now();
  
  // ✅ Only re-analyze every 30 seconds (prevents infinite loop)
  if (now - lastAnalyzedTime < 30000) return;

  // ✅ Only trigger if NEW comments actually appeared
  const comments = document.querySelectorAll("ytd-comment-renderer #content-text");
  if (comments.length > 0) {
    console.log("🔍 New batch of comments detected, re-analyzing...");
    lastAnalyzedTime = now;
    analyzeComments();
  }
});

// Observe only YouTube’s comment section — not the entire page
const commentSection = document.querySelector("ytd-comments") || document.body;
observer.observe(commentSection, { childList: true, subtree: true });

window.addEventListener("yt-page-data-updated", () => {
  console.log("🔁 Video changed — re-running analysis...");
  setTimeout(analyzeComments, 4000);
});
