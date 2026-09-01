const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
const openAiKey = process.env.OPENAI_API_KEY;

if (!webhookUrl) {
  throw new Error("DISCORD_WEBHOOK_URL secret is missing.");
}

if (!openAiKey) {
  throw new Error("OPENAI_API_KEY secret is missing.");
}

// --------------------------------------------------
// UK DATE / TIME
// --------------------------------------------------

const now = new Date();

const ukDate = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/London",
  weekday: "long",
  day: "2-digit",
  month: "long",
  year: "numeric"
}).format(now);

const ukTime = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/London",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false
}).format(now);

console.log(`UK time: ${ukTime}`);
console.log(`UK date: ${ukDate}`);

// --------------------------------------------------
// DETERMINE WHICH BRIEF TO GENERATE
// --------------------------------------------------

// Manual GitHub run = generate Morning Brief for testing.
// Scheduled runs choose according to UK time.

const isManualRun = process.env.GITHUB_EVENT_NAME === "workflow_dispatch";

let briefType;

if (isManualRun) {
  briefType = "morning";
} else if (ukTime === "08:00") {
  briefType = "morning";
} else if (ukTime === "12:30") {
  briefType = "ny";
} else {
  console.log(`No Forex Fire brief scheduled for ${ukTime}.`);
  process.exit(0);
}

console.log(`Generating brief type: ${briefType}`);

// --------------------------------------------------
// PROMPTS
// --------------------------------------------------

const morningPrompt = `
You are creating the Forex Fire weekday Morning Market Brief for a forex trading Discord community.

Date: ${ukDate}
Time: approximately 08:00 Europe/London.

Create a concise but useful professional market preparation brief focused on:

- EURUSD
- GBPUSD
- USDJPY
- USDCHF
- USDCAD
- AUDUSD
- NZDUSD
- XAUUSD / Gold

The purpose is preparation before the main London session develops.

Include:

1. FOREX FIRE MORNING BRIEF heading
2. Today's date
3. Key economic news/events to be aware of today
4. Overall USD tone / market sentiment
5. Major currency themes
6. Gold outlook
7. Pairs showing the clearest potential strength vs weakness
8. Important liquidity areas traders should be conscious of
9. A short "What I'm Watching" section
10. Clear reminder that this is market analysis, not financial advice

Keep it trader-friendly and easy to read in Discord.

Do not invent exact prices, economic figures, news releases, market moves or events if you do not have verified live data.

If current live market data is unavailable, clearly say that the brief is a structural/session preparation overview and avoid pretending that you have live prices.

Use emojis sparingly and keep the formatting clean.
`;

const nyPrompt = `
You are creating the Forex Fire weekday London Session Overview and New York Session Look Ahead for a forex trading Discord community.

Date: ${ukDate}
Time: approximately 12:30 Europe/London.

Focus on:

- EURUSD
- GBPUSD
- USDJPY
- USDCHF
- USDCAD
- AUDUSD
- NZDUSD
- XAUUSD / Gold

Create the report in two clear parts.

PART 1 — LONDON SESSION OVERVIEW

Summarise the London session so far:
- general risk tone
- USD behaviour
- which major currencies appear strongest and weakest
- notable directional behaviour
- liquidity themes
- whether the session has been trending, ranging or mixed
- Gold behaviour

PART 2 — NEW YORK LOOK AHEAD

Cover:
- important US / Canadian economic events still ahead
- USD risks for New York
- major pairs worth watching
- Gold outlook into New York
- potential continuation versus reversal themes
- liquidity areas traders should be aware of
- a concise "What I'm Watching Into NY" section

Finish with a clear reminder that this is market analysis, not financial advice.

Do not invent exact live prices, economic figures, news releases or market moves if you do not have verified live data.

If live market data is unavailable, clearly state that limitation and give a structural/session-based outlook rather than pretending to know current prices.

Make the output easy to read in Discord and avoid unnecessary filler.
`;

// --------------------------------------------------
// OPENAI
// --------------------------------------------------

async function generateBrief(prompt) {
  console.log("Calling OpenAI...");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openAiKey}`
    },
    body: JSON.stringify({
      model: "gpt-5-mini",
      messages: [
        {
          role: "system",
          content:
            "You are the Forex Fire market briefing assistant. Be concise, structured and transparent about data limitations."
        },
        {
          role: "user",
          content: prompt
        }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `OpenAI request failed: ${response.status} ${errorText}`
    );
  }

  const data = await response.json();

  const text = data?.choices?.[0]?.message?.content;

  if (!text) {
    throw new Error("OpenAI returned no briefing text.");
  }

  console.log("OpenAI brief generated successfully.");

  return text.trim();
}

// --------------------------------------------------
// DISCORD
// --------------------------------------------------

async function sendDiscordChunk(content) {
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      content
    })
  });

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Discord webhook failed: ${response.status} ${errorText}`
    );
  }
}

function splitForDiscord(text, maxLength = 1900) {
  const chunks = [];

  let remaining = text;

  while (remaining.length > maxLength) {
    let splitIndex = remaining.lastIndexOf("\n", maxLength);

    if (splitIndex < 500) {
      splitIndex = maxLength;
    }

    chunks.push(remaining.slice(0, splitIndex).trim());

    remaining = remaining.slice(splitIndex).trim();
  }

  if (remaining.length > 0) {
    chunks.push(remaining);
  }

  return chunks;
}

async function sendDiscordBrief(title, brief) {
  const fullMessage = `${title}\n\n${brief}`;

  const chunks = splitForDiscord(fullMessage);

  console.log(`Sending ${chunks.length} Discord message part(s).`);

  for (let i = 0; i < chunks.length; i++) {
    let content = chunks[i];

    if (chunks.length > 1) {
      content =
        `**Part ${i + 1}/${chunks.length}**\n\n` +
        content;
    }

    await sendDiscordChunk(content);

    console.log(`Discord part ${i + 1}/${chunks.length} sent.`);
  }
}

// --------------------------------------------------
// RUN
// --------------------------------------------------

const selectedPrompt =
  briefType === "morning"
    ? morningPrompt
    : nyPrompt;

const title =
  briefType === "morning"
    ? `🔥 **FOREX FIRE MORNING BRIEF — ${ukDate}** 🔥`
    : `🔥 **FOREX FIRE LONDON OVERVIEW + NEW YORK LOOK AHEAD — ${ukDate}** 🔥`;

const brief = await generateBrief(selectedPrompt);

await sendDiscordBrief(title, brief);

console.log(
  `Forex Fire ${briefType} Discord brief completed successfully.`
);
