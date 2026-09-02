const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
const openAiKey = process.env.OPENAI_API_KEY;
const briefType = process.env.BRIEF_TYPE || "morning";

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
console.log(`Brief type: ${briefType}`);

// --------------------------------------------------
// PROMPTS
// --------------------------------------------------

const morningPrompt = `
You are creating the Forex Fire weekday Morning Market Brief for a forex trading Discord community.

Date: ${ukDate}
Time: approximately 08:00 Europe/London.

Create a concise, professional morning market-preparation brief for traders before the main London session.

The report should include:

1. Key economic news and events scheduled for today
2. Overall USD tone / broad market sentiment
3. Major currency themes
4. Gold (XAUUSD) outlook
5. Pairs showing the clearest potential relative strength vs weakness
6. Important liquidity areas traders should be conscious of
7. A short London-session market watch

Important:
- Focus on what matters for today's trading day.
- Do not invent exact prices, economic figures, news releases or market moves.
- If live/current market data is unavailable, say so clearly.
- Keep the report concise and suitable for Discord.
- Do not offer additional work.
- Do not ask follow-up questions.
- Do not say "If you want, I can".
- Finish naturally with a short market-analysis / not-financial-advice reminder.
`;

const nyPrompt = `
You are creating the Forex Fire London Recap + New York Look Ahead for a forex trading Discord community.

Date: ${ukDate}
Time: approximately 12:30 Europe/London.

This is NOT a morning brief.

Create a concise, current mid-session report focused on what has happened during the London session and what traders should watch into New York.

Structure the report exactly around these areas:

1. LONDON SESSION RECAP
Summarise the most important moves seen during the London session so far.
Focus on:
- GBP
- EUR
- USD
- JPY
- Gold / XAUUSD
- any standout relative strength or weakness
- whether the market has been risk-on, risk-off or mixed

2. NEWS + MARKET REACTION
Summarise the important economic releases, central-bank comments or major headlines that affected European / London trading today.
Where current verified data is available, explain the actual market reaction.
If exact live figures are unavailable, do not invent them.

3. LONDON LIQUIDITY / STRUCTURE
Highlight useful structural observations such as:
- previous session highs/lows being taken
- London high / low behaviour
- obvious liquidity sweeps
- directional USD pressure
- notable gold behaviour
Keep this practical for Forex Fire traders.

4. NEW YORK LOOK AHEAD
Explain the main themes likely to matter as New York opens.
State what could strengthen or weaken USD, equities, risk sentiment and Gold.
Keep this focused on today's session rather than generic education.

5. UPCOMING NEW YORK EVENTS
List the important US and Canadian economic events still due today.
Include UK times where reliably known.
Mention which events could create the most volatility.
Do not invent events or times.

6. NY MARKET WATCH
Give a short watchlist of the most relevant instruments for New York, such as:
- EURUSD
- GBPUSD
- USDJPY
- XAUUSD
- USDCAD
Only include instruments that are genuinely relevant to today's conditions.
For each, explain what condition or theme makes it worth watching.
Do not give guaranteed trade calls or signals.

7. QUICK BIAS SNAPSHOT
Finish with a very short summary:
- USD: bullish / bearish / mixed
- GBP: bullish / bearish / mixed
- EUR: bullish / bearish / mixed
- JPY: bullish / bearish / mixed
- Gold: bullish / bearish / mixed

Important:
- This must read like a real 12:30 London recap + New York preparation report.
- Do not repeat morning-brief wording.
- Do not fill space with generic forex education.
- Be concise.
- Be specific where current verified information is available.
- If live/current data is unavailable, clearly state the limitation instead of inventing facts.
- Do not offer additional work.
- Do not ask follow-up questions.
- Do not say "If you want, I can".
- Finish naturally with a short market-analysis / not-financial-advice reminder.
`;

// --------------------------------------------------
// CHOOSE PROMPT
// --------------------------------------------------

let prompt;

if (briefType === "ny") {
  prompt = nyPrompt;
} else {
  prompt = morningPrompt;
}

// --------------------------------------------------
// OPENAI
// --------------------------------------------------

async function generateBrief(prompt) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openAiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content:
            "You are the Forex Fire market briefing assistant. Be concise, structured and transparent about data limitations. Never offer additional work, never ask follow-up questions, and never end with phrases such as 'If you want, I can'."
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

  const text =
    data?.choices?.[0]?.message?.content?.trim();

  if (!text) {
    throw new Error("OpenAI returned an empty response.");
  }

  return text;
}

// --------------------------------------------------
// DISCORD MESSAGE SPLITTING
// --------------------------------------------------

function splitForDiscord(text, maxLength = 1900) {
  const chunks = [];
  let remaining = text.trim();

  while (remaining.length > maxLength) {
    let splitAt = remaining.lastIndexOf("\n", maxLength);

    if (splitAt < 500) {
      splitAt = remaining.lastIndexOf(" ", maxLength);
    }

    if (splitAt < 500) {
      splitAt = maxLength;
    }

    chunks.push(remaining.slice(0, splitAt).trim());
    remaining = remaining.slice(splitAt).trim();
  }

  if (remaining.length > 0) {
    chunks.push(remaining);
  }

  return chunks;
}

// --------------------------------------------------
// POST TO DISCORD
// --------------------------------------------------

async function postToDiscord(text) {
  const parts = splitForDiscord(text);

  for (let i = 0; i < parts.length; i++) {
    const prefix =
      parts.length > 1
        ? `**Part ${i + 1}/${parts.length}**\n\n`
        : "";

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        content: prefix + parts[i]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Discord webhook failed: ${response.status} ${errorText}`
      );
    }

    await new Promise(resolve => setTimeout(resolve, 700));
  }
}

// --------------------------------------------------
// RUN
// --------------------------------------------------

async function main() {
  console.log(`Generating ${briefType} brief...`);

  const brief = await generateBrief(prompt);

  console.log("Brief generated.");

  await postToDiscord(brief);

  console.log("Discord post complete.");
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
