const API_URL = "https://tekh-bot.vercel.app/api/v1/chat/message";

const userInputField = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const chatbox = document.getElementById("chatbox");
const scrollToBottomBtn = document.getElementById("scrollToBottomBtn");
let isWaitingForResponse = false;
let chatHistory = [];
const SCROLL_BOTTOM_THRESHOLD = 80;
let autoScrollEnabled = true;
let isProgrammaticScroll = false;
let activeStreamFinalizer = null;

// Initialize Theme & Chat History on page load
window.addEventListener("DOMContentLoaded", () => {
  // 1. Theme Loading
  const savedTheme = localStorage.getItem("theme") || "dark";
  document.body.setAttribute("data-theme", savedTheme);
  updateThemeIcon(savedTheme);

  // 2. Load Chat History
  const savedHistory = localStorage.getItem("chatHistory");
  if (savedHistory) {
    try {
      chatHistory = JSON.parse(savedHistory);
      // Remove the hardcoded initial greeting to prevent duplicates, or we just leave the hardcoded one in HTML.
      // To strictly match localStorage, let's clear the chatbox and render all stored history instead.
      const hasRealHistory = chatHistory.some(msg => msg.role === 'user');
      if (hasRealHistory) {
        chatbox.innerHTML = ''; // Clear default HTML greeting if there is a real session
        chatHistory.forEach(msg => {
          if (msg.role === "user") appendUserMessageDOM(msg.content);
          else appendBotMessageDOM(msg.content, false);
        });
      }
    } catch (e) {
      console.error("Could not parse saved chat history.");
      chatHistory = [];
    }
  }
  
  scrollToBottom({ force: true, behavior: "auto" });
  updateScrollToBottomButton();
});

chatbox.addEventListener("scroll", () => {
  if (isProgrammaticScroll) return;
  autoScrollEnabled = isNearBottom();
  updateScrollToBottomButton();
});

if (scrollToBottomBtn) {
  scrollToBottomBtn.addEventListener("click", () => {
    autoScrollEnabled = true;
    scrollToBottom({ force: true });
    updateScrollToBottomButton();
  });
}

document.addEventListener("visibilitychange", () => {
  // Browsers throttle animation frames in background tabs, so finalize active stream immediately.
  if (document.hidden && typeof activeStreamFinalizer === "function") {
    activeStreamFinalizer();
  }
});

// Auto-expand textarea
userInputField.addEventListener("input", function() {
  this.style.height = "auto";
  this.style.height = (this.scrollHeight) + "px";
  
  if (this.value.trim() !== "") {
    sendBtn.classList.remove("disabled");
  } else {
    sendBtn.classList.add("disabled");
  }
});

// Handle Enter key (Shift+Enter for newline)
userInputField.addEventListener("keydown", function(event) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    if (!isWaitingForResponse) {
      sendMessage();
    }
  }
});

// New Chat Functionality
function startNewChat() {
  const isConfirmed = confirm("Are you sure you want to start a new chat? Your current chat cannot be recovered.");
  if (isConfirmed) {
    // Drop memory
    chatHistory = [];
    localStorage.removeItem("chatHistory");
    
    // Wipe UI
    chatbox.innerHTML = '';
    
    // Inject default initial greeting
    appendBotMessageDOM("Hello! I'm Tekh-BoT, your personal AI assistant. How can I help you today?", false);
    scrollToBottom({ force: true, behavior: "auto" });
  }
}

// Theme Management
function toggleTheme() {
  const body = document.body;
  const currentTheme = body.getAttribute("data-theme");
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  
  body.setAttribute("data-theme", newTheme);
  localStorage.setItem("theme", newTheme);
  updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
  const themeIcon = document.getElementById("theme-icon");
  if (!themeIcon) return;
  if (theme === "dark") {
    themeIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>`;
  } else {
    themeIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>`;
  }
}

function saveHistory(role, content) {
  chatHistory.push({ role, content });
  localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
}

async function sendMessage() {
  let userMessage = userInputField.value.trim();
  if (!userMessage || isWaitingForResponse) return;

  isWaitingForResponse = true;
  sendBtn.classList.add("disabled");

  // Display user's message and save it globally
  saveHistory("user", userMessage);
  appendUserMessageDOM(userMessage);

  // Clear input field, reset height
  userInputField.value = "";
  userInputField.style.height = "auto";
  
  // Display an engaging loading indicator bubble
  const loaderDiv = document.createElement("div");
  loaderDiv.className = "message-wrapper bot fade-up loading-wrapper";
  loaderDiv.innerHTML = `
    <div class="message">
      <img src="https://res.cloudinary.com/dd7ec5m1r/image/upload/v1743444567/bot_eml3rl.png" class="avatar"/>
      <div class="msg-content loading-box">
         <div class="spinner"></div>
         <span class="loading-text">Analyzing context...</span>
      </div>
    </div>
  `;
  chatbox.appendChild(loaderDiv);
  scrollToBottom({ force: true });

  // Cycle engaging wait texts
  const loaderTexts = ["Analyzing context...", "Searching knowledge base...", "Generating response...", "Just a moment..."];
  let loaderIndex = 0;
  const loadingTextEl = loaderDiv.querySelector(".loading-text");
  
  // Attach the interval ID to the loader div so we can clear it later
  loaderDiv.dataset.intervalId = setInterval(() => {
    loaderIndex = (loaderIndex + 1) % loaderTexts.length;
    if (loadingTextEl) loadingTextEl.innerText = loaderTexts[loaderIndex];
  }, 2500);

  // Pick the last 6 messages (3 interactions: user/bot, user/bot, user/bot) to act as context length
  const recentHistory = chatHistory.slice(-6);

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: userMessage, history: recentHistory }),
    });

    const data = await response.json();
    let botReply = "An error occurred fetching the response.";

    if (response.ok && data.success) {
      botReply = data.answer;
    } else if (data.message) {
      botReply = data.message;
    }

    // Remove loading indicator
    const loaders = document.querySelectorAll('.loading-wrapper');
    loaders.forEach(el => {
      if (el.dataset.intervalId) clearInterval(el.dataset.intervalId);
      el.remove();
    });

    // Persist immediately so tab switches do not lose bot responses.
    saveHistory("bot", botReply);
    
    // Display bot's response with a streaming effect
    await appendBotMessageDOM(botReply, { animateFade: true, stream: true });

  } catch (error) {
    console.error("Error communicating with AI server:", error);
    const loaders = document.querySelectorAll('.loading-wrapper');
    loaders.forEach(el => {
      if (el.dataset.intervalId) clearInterval(el.dataset.intervalId);
      el.remove();
    });
    
    appendErrorMessage("Cannot connect to server. Please try after some time or contact the site owner.");
  } finally {
    isWaitingForResponse = false;
    if (userInputField.value.trim() !== "") {
      sendBtn.classList.remove("disabled");
    }
  }
}

function appendUserMessageDOM(text) {
  const wrapper = document.createElement("div");
  wrapper.className = "message-wrapper user fade-up";
  
  const initial = "U";
  
  wrapper.innerHTML = `
    <div class="message">
      <div class="avatar user-avatar">${initial}</div>
      <div class="msg-content">${escapeHTML(text)}</div>
    </div>
  `;
  chatbox.appendChild(wrapper);
  scrollToBottom({ force: true });
}

function createBotMessageShell(animateFade = false) {
  const wrapper = document.createElement("div");
  wrapper.className = "message-wrapper bot";
  // Add fade-up class conditionally
  if (animateFade) wrapper.classList.add("fade-up");

  const innerMessage = document.createElement("div");
  innerMessage.className = "message";
  
  const avatar = document.createElement("img");
  avatar.src = "https://res.cloudinary.com/dd7ec5m1r/image/upload/v1743444567/bot_eml3rl.png";
  avatar.className = "avatar";
  
  const content = document.createElement("div");
  content.className = "msg-content";
  
  innerMessage.appendChild(avatar);
  innerMessage.appendChild(content);
  wrapper.appendChild(innerMessage);
  chatbox.appendChild(wrapper);

  return content;
}

function attachCopyButtons(content) {
  const preElements = content.querySelectorAll("pre");
  preElements.forEach((pre) => {
    const codeEl = pre.querySelector("code");
    if (codeEl) {
      const copyBtn = document.createElement("button");
      copyBtn.className = "copy-btn";
      copyBtn.innerText = "Copy";
      
      copyBtn.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(codeEl.innerText);
          copyBtn.innerText = "Copied!";
          setTimeout(() => {
            copyBtn.innerText = "Copy";
          }, 2000);
        } catch (err) {
          console.error("Failed to copy text: ", err);
        }
      });
      
      pre.appendChild(copyBtn);
    }
  });
}

function getNextChunk(text, index) {
  const remaining = text.length - index;
  if (remaining <= 0) return "";

  const currentChar = text[index];

  // Keep markdown structure intact while streaming.
  if (currentChar === "\n") return "\n";
  if (text.slice(index, index + 3) === "```") return "```";

  // Group words for smooth but readable token streaming.
  const maxChunk = Math.min(remaining, 5);
  let chunkSize = 1;

  for (let i = 1; i <= maxChunk; i += 1) {
    const ch = text[index + i - 1];
    if (ch === " " || ch === "\n") {
      chunkSize = i;
      break;
    }

    chunkSize = i;
    if (i === 5 || /[.,!?;:)]/.test(ch)) break;
  }

  return text.slice(index, index + chunkSize);
}

async function streamBotMessage(content, markdownText) {
  let index = 0;
  let visibleText = "";
  const cursor = '<span class="streaming-cursor"></span>';

  return new Promise((resolve) => {
    let completed = false;

    const finalizeStream = () => {
      if (completed) return;
      completed = true;
      activeStreamFinalizer = null;
      content.innerHTML = marked.parse(markdownText);
      attachCopyButtons(content);
      scrollToBottom();
      resolve();
    };

    activeStreamFinalizer = finalizeStream;

    function tick() {
      if (completed) {
        return;
      }

      if (index >= markdownText.length) {
        finalizeStream();
        return;
      }

      const chunk = getNextChunk(markdownText, index);
      visibleText += chunk;
      index += chunk.length;

      content.innerHTML = marked.parse(visibleText) + cursor;
      scrollToBottom();

      const lastChar = chunk[chunk.length - 1] || "";
      let delay = 16;

      if (lastChar === "\n") delay = 35;
      else if (/[.,!?]/.test(lastChar)) delay = 45;
      else if (chunk.includes("```")) delay = 24;

      setTimeout(tick, delay);
    }

    // Render immediately if the tab is hidden; otherwise animate progressively.
    if (document.hidden) {
      finalizeStream();
      return;
    }

    setTimeout(tick, 0);
  });
}

async function appendBotMessageDOM(markdownText, options = {}) {
  const normalizedOptions = typeof options === "boolean"
    ? { animateFade: options, stream: false }
    : (options || {});
  const { animateFade = false, stream = false } = normalizedOptions;

  const content = createBotMessageShell(animateFade);

  if (stream) {
    await streamBotMessage(content, markdownText);
    return;
  }

  content.innerHTML = marked.parse(markdownText);
  attachCopyButtons(content);

  scrollToBottom();
}

function appendErrorMessage(text) {
  const wrapper = document.createElement("div");
  wrapper.className = "message-wrapper bot fade-up";
  wrapper.innerHTML = `
    <div class="message">
      <img src="https://res.cloudinary.com/dd7ec5m1r/image/upload/v1743444567/bot_eml3rl.png" class="avatar"/>
      <div class="msg-content error">${text}</div>
    </div>
  `;
  chatbox.appendChild(wrapper);
  scrollToBottom();
}

function isNearBottom() {
  const distanceFromBottom = chatbox.scrollHeight - (chatbox.scrollTop + chatbox.clientHeight);
  return distanceFromBottom <= SCROLL_BOTTOM_THRESHOLD;
}

function updateScrollToBottomButton() {
  if (!scrollToBottomBtn) return;
  const shouldShow = !isNearBottom();
  scrollToBottomBtn.classList.toggle("visible", shouldShow);
}

function scrollToBottom(options = {}) {
  const { force = false, behavior = "smooth" } = options;
  if (!force && !autoScrollEnabled) return;

  isProgrammaticScroll = true;
  chatbox.scrollTo({
    top: chatbox.scrollHeight,
    behavior
  });

  requestAnimationFrame(() => {
    isProgrammaticScroll = false;
    autoScrollEnabled = isNearBottom();
    updateScrollToBottomButton();
  });
}

function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}
