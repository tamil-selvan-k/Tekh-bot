const API_URL = "http://localhost:5000/api/v1/chat/message";

const userInputField = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const chatbox = document.getElementById("chatbox");
let isWaitingForResponse = false;
let chatHistory = [];

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
  
  scrollToBottom();
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
  appendUserMessageDOM(userMessage);
  saveHistory("user", userMessage);

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
  scrollToBottom();

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
    
    // Display bot's response
    appendBotMessageDOM(botReply, true);
    saveHistory("bot", botReply);

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
  scrollToBottom();
}

function appendBotMessageDOM(markdownText, animateFade = false) {
  const wrapper = document.createElement("div");
  wrapper.className = "message-wrapper bot";
  // Add fade-up class conditionally
  if (animateFade) wrapper.classList.add("fade-up");
  
  const parsedHTML = marked.parse(markdownText);

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

  content.innerHTML = parsedHTML;
  
  // Attach Copy Buttons to all code blocks
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

function scrollToBottom() {
  chatbox.scrollTo({
    top: chatbox.scrollHeight,
    behavior: "smooth"
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
