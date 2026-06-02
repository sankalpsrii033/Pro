// =====================================================
// TRADE GPT PRO TERMINAL
// app.js
// =====================================================

// ----------------------------
// Helpers
// ----------------------------

const $ = (id) => document.getElementById(id);

const SETTINGS = {
  OPENROUTER_KEY: "or_key",
  OPENROUTER_MODEL: "or_model",
  FINNHUB_KEY: "finnhub_key"
};

// ----------------------------
// Startup
// ----------------------------

document.addEventListener("DOMContentLoaded", () => {
  initializeApp();
});

function initializeApp() {
  loadSettings();

  if ($("settingsBtn")) {
    $("settingsBtn").addEventListener("click", openSettings);
  }

  if ($("saveSettings")) {
    $("saveSettings").addEventListener("click", saveSettings);
  }

  if ($("runBtn")) {
    $("runBtn").addEventListener("click", runAnalysis);
  }

  if ($("sendBtn")) {
    $("sendBtn").addEventListener("click", sendChatMessage);
  }

  if ($("chatInput")) {
    $("chatInput").addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        sendChatMessage();
      }
    });
  }
}

// ----------------------------
// Settings
// ----------------------------

function openSettings() {
  $("settingsModal").style.display = "flex";
}

function closeSettings() {
  $("settingsModal").style.display = "none";
}

function saveSettings() {
  localStorage.setItem(
    SETTINGS.OPENROUTER_KEY,
    $("orKey").value.trim()
  );

  localStorage.setItem(
    SETTINGS.OPENROUTER_MODEL,
    $("orModel").value.trim()
  );

  localStorage.setItem(
    SETTINGS.FINNHUB_KEY,
    $("finnhubKey").value.trim()
  );

  alert("Settings saved successfully.");
  closeSettings();
}

function loadSettings() {
  if ($("orKey")) {
    $("orKey").value =
      localStorage.getItem(SETTINGS.OPENROUTER_KEY) || "";
  }

  if ($("orModel")) {
    $("orModel").value =
      localStorage.getItem(SETTINGS.OPENROUTER_MODEL) ||
      "openai/gpt-5";
  }

  if ($("finnhubKey")) {
    $("finnhubKey").value =
      localStorage.getItem(SETTINGS.FINNHUB_KEY) || "";
  }
}

// ----------------------------
// Analysis
// ----------------------------

async function runAnalysis() {
  const stock = $("stock").value.trim().toUpperCase();
  const capital = $("capital").value.trim();
  const risk = $("risk").value.trim();
  const mode = $("mode").value;

  if (!stock) {
    alert("Please enter a stock symbol.");
    return;
  }

  $("reportOutput").innerHTML =
    "<p>Running analysis...</p>";

  try {
    const marketData = await getFinnhubData(stock);

    const prompt = buildAnalysisPrompt(
      stock,
      capital,
      risk,
      mode,
      marketData
    );

    const result = await callOpenRouter(prompt);

    $("reportOutput").innerHTML = marked.parse(result);
  } catch (error) {
    console.error(error);

    $("reportOutput").textContent =
      "Analysis failed.\n\n" + error.message;
  }
}

// ----------------------------
// Prompt Builder
// ----------------------------

function buildAnalysisPrompt(
  stock,
  capital,
  risk,
  mode,
  marketData
) {
  return `
You are Trade GPT Pro.

Stock: ${stock}
Capital: ${capital}
Risk: ${risk}%

Market Data:
${JSON.stringify(marketData, null, 2)}

Analysis Mode:
${mode}

MODE RULES:

B+:
- Quick scan
- Short summary
- Fast decision

A+:
- Balanced analysis
- Structure
- Volume
- VWAP
- Risk

A++:
- Deep institutional analysis
- Trade thesis
- Bull case
- Bear case
- Risk assessment
- Invalidation thesis
- Detailed reasoning

Output Format:

TRADE GPT PRO REPORT CARD

STOCK:
MODE:
GRADE:
VERDICT:

ENTRY ZONE:
STOP LOSS:

TARGETS:
T1:
T2:
T3:

CONFLUENCE SCORE:

RISK LEVEL:

REASON SUMMARY:

For A++ include:
- Market Structure
- Liquidity
- Volume
- Bull Thesis
- Bear Thesis
- Trade Invalidation
- Final Decision

Allowed verdicts:
BUY
SELL
HOLD
NO TRADE
`;
}

// ----------------------------
// OpenRouter
// ----------------------------

async function callOpenRouter(prompt) {
  const apiKey =
    localStorage.getItem(SETTINGS.OPENROUTER_KEY);

  const model =
    localStorage.getItem(SETTINGS.OPENROUTER_MODEL) ||
    "openai/gpt-5";

  if (!apiKey) {
    return generateDemoReport();
  }

  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        max_tokens: 250,
  temperature: 0.4,
        messages: [
  {
    role: "system",
    content: `
You are Trade GPT Pro Support Assistant.

Rules:
- Answer in plain English.
- Maximum 100 words.
- No markdown.
- No tables.
- No code blocks.
- No technical formatting.
- Keep answers short and mobile friendly.
- Only help with Trade GPT Pro usage.
`
  },
  {
    role: "user",
    content: prompt
  }
]
      })
    }
  );

  if (!response.ok) {
    throw new Error(
      "OpenRouter Error: " + response.status
    );
  }

  const data = await response.json();

  return (
    data?.choices?.[0]?.message?.content ||
    "No response returned."
  );
}

// ----------------------------
// Finnhub
// ----------------------------

async function getFinnhubData(symbol) {
  const apiKey =
    localStorage.getItem(SETTINGS.FINNHUB_KEY);

  if (!apiKey) {
    return {
      status: "demo_mode"
    };
  }

  try {
    const url =
      `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Finnhub request failed");
    }

    const data = await response.json();

    return data;
  } catch (error) {
    console.error(error);

    return {
      status: "finnhub_error"
    };
  }
}

// ----------------------------
// Chat Assistant
// ----------------------------

async function sendChatMessage() {
  const input = $("chatInput");

  const message = input.value.trim();

  if (!message) return;

  addChatMessage("You", message);

  input.value = "";

  try {
    const reply = await callOpenRouter(
`
You are Trade GPT Pro Support Assistant.

Rules:
- Answer in plain English or in pointers
- Maximum 100 words.
- No markdown.
- No tables.
- No code blocks.
- No technical formatting.
- Keep answers short and mobile friendly.
- Only help with Trade GPT Pro usage.
- you know everythinga about the system which you have to explain to the user
User Question:
${message}
`
);

    addChatMessage("Assistant", reply);
  } catch (error) {
    addChatMessage(
      "Assistant",
      "Unable to process request."
    );
  }
}

function addChatMessage(sender, text) {
  const history = $("chatHistory");

  const wrapper = document.createElement("div");

  wrapper.style.marginBottom = "12px";

wrapper.innerHTML = `
<div class="chat-message">
  <strong>${sender}</strong>
  <div>${escapeHtml(text).replace(/\n/g,"<br>")}</div>
</div>
`;

  history.appendChild(wrapper);

  history.scrollTop = history.scrollHeight;
}

// ----------------------------
// Demo Report
// ----------------------------

function generateDemoReport() {
  return `
TRADE GPT PRO REPORT CARD

STOCK: DEMO

GRADE: A

VERDICT: BUY

ENTRY ZONE:
100 - 102

STOP LOSS:
97

TARGETS:
T1: 105
T2: 110
T3: 115

CONFLUENCE SCORE:
8.2 / 10

RISK LEVEL:
LOW

REASON SUMMARY:
Demo mode active.

Add OpenRouter API key
for live AI-powered reports.
`;
}

// ----------------------------
// Utilities
// ----------------------------

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
      }
function formatMarkdown(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br>");
}
