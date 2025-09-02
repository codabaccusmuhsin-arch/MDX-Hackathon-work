document.addEventListener("DOMContentLoaded", () => {
  const chatContainer = document.getElementById("chat");
  const input = document.getElementById("message");
  const sendBtn = document.getElementById("send");

  function addMessage(text, sender = "bot") {
    const msgDiv = document.createElement("div");
    msgDiv.className = "message";
    msgDiv.textContent = text;
    chatContainer.appendChild(msgDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  async function sendMessage() {
    const message = input.value.trim();
    if (!message) return;

    addMessage(message, "user");
    input.value = "";

    try {
      const response = await fetch(`/stats/ai-query/?q=${encodeURIComponent(message)}`);      if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
      const answer = await response.text(); 
      addMessage(answer, "bot");
    } catch (err) {
      console.error("Fetch error:", err);
      addMessage("Error: Could not reach AI service.", "bot");
    }
  }

  sendBtn.addEventListener("click", sendMessage);
  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
  });
});
