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
You are the Forex Fire market briefing assistant.

Today is ${ukDate}.
Current UK time is approximately ${ukTime}.
Timezone: Europe/London.

You MUST use web search to research CURRENT information for TODAY before writing this report.

Create a concise Forex Fire Morning Brief designed for forex traders preparing for the London session.

IMPORTANT RESEARCH REQUIREMENTS

Search the web for:

- today's confirmed economic calendar
- important overnight Asian-session developments
- current forex market news
- GBP developments
- EUR developments
- USD developments
- JPY developments
- Gold / XAUUSD developments
- major central-bank commentary
- geopolitical or risk sentiment developments
- today's important UK, European, US and Canadian events

Use credible current sources.

Do NOT invent:
- economic releases
- economic figures
- speeches
- market prices
- support/resistance levels
- currency moves
- news events

If something cannot be verified, leave it out.

Keep the report practical and concise.

FORMAT:

🔥 FOREX FIRE MORNING BRIEF — ${ukDate} 🔥

🌏 OVERNIGHT / ASIA RECAP
Give a short factual summary of what happened overnight and during Asia that matters for FX and Gold.

📅 TODAY'S KEY EVENTS
List today's important scheduled economic events in UK time.
Focus primarily on medium/high-impact events affecting:
GBP, EUR, USD, CAD, JPY and Gold.

Include:
UK TIME — EVENT — CURRENCY

Only include events you can verify.

💵 USD / MARKET SENTIMENT
Give today's current USD tone and broader risk sentiment based on researched market information.

💷 GBP
Give the current GBP theme.

💶 EUR
Give the current EUR theme.

💴 JPY
Give the current JPY theme.

🥇 GOLD — XAUUSD
Give a concise current Gold overview.
Do not invent price levels.

🔥 LONDON MARKET WATCH
Give 3 to 5 instruments worth watching during London.

For each:
PAIR — what makes it interesting today.

Do NOT give trade signals.

⚡ QUICK BIAS
USD:
GBP:
EUR:
JPY:
GOLD:

Use only:
Bullish / Bearish / Mixed

Finish with:
Market analysis only — not financial advice.

Keep the entire report concise enough for Discord.
Avoid generic forex education.
Do not tell traders to "check the calendar" — YOU are researching the calendar.
`;

const nyPrompt = `
You are the Forex Fire market briefing assistant.

Today is ${ukDate}.
Current UK time is approximately ${ukTime}.
Timezone: Europe/London.

This is the FOREX FIRE LONDON RECAP + NEW YORK LOOK AHEAD.

You MUST use web search and research CURRENT information for TODAY before writing the report.

This is NOT a Morning Brief.

RESEARCH TODAY'S ACTUAL MARKET FIRST.

Search for:

- what happened in forex during today's London session
- GBP performance during London
- EUR performance during London
- USD performance during London
- JPY performance
- Gold / XAUUSD performance
- today's UK and European economic releases
- today's central-bank comments
- today's major market headlines
- market reaction to today's data/news
- current risk sentiment
- US economic events still due today
- Canadian events still due today
- major US session themes
- current forex / Gold market news

Use credible current sources.

VERY IMPORTANT:

Do NOT invent:
- prices
- support/resistance numbers
- economic figures
- speeches
- market reactions
- currency strength
- news
- scheduled events

If a piece of information cannot be verified, omit it.

FORMAT:

🔥 FOREX FIRE — LONDON RECAP + NY LOOK AHEAD 🔥
${ukDate}

🇬🇧 LONDON SESSION RECAP
Give a concise factual summary of what actually happened during London trading so far.

Focus on:
GBP
EUR
USD
JPY
Gold

Mention clear relative strength/weakness only where supported by current information.

📰 NEWS + MARKET REACTION
List the major economic releases, central-bank comments or headlines that affected today's London session.

For each relevant item:
NEWS / DATA
WHAT HAPPENED
MARKET REACTION

Keep this brief.

💧 LONDON LIQUIDITY / STRUCTURE
Describe useful session observations only if they can reasonably be supported by current market reporting.

Examples:
- London high/low pressure
- USD directional pressure
- risk-on/risk-off flows
- Gold reaction
- major session reversals

Do NOT invent chart levels.

🇺🇸 NEW YORK LOOK AHEAD
Explain the key themes that matter as New York approaches.

Focus on:
- USD
- US yields
- equities/risk sentiment
- Gold
- major FX themes

📅 UPCOMING NEW YORK EVENTS
List the important US and Canadian events STILL TO COME today.

Use UK times.

Format:
UK TIME — EVENT — CURRENCY — IMPACT

Only include verified events.

🔥 NY MARKET WATCH
Give 3 to 5 instruments genuinely worth watching for New York.

For each:

PAIR / INSTRUMENT
WHY IT MATTERS TODAY
WHAT TO WATCH FOR

Do NOT invent exact price levels.
Do NOT give guaranteed trade signals.

⚡ QUICK BIAS SNAPSHOT
USD:
GBP:
EUR:
JPY:
GOLD:

Use:
Bullish / Bearish / Mixed

Finish with:
Market analysis only — not financial advice.

The report must be:
- factual
- current
- concise
- useful
- based on today's researched information
- free from generic forex education

Do not say you do not have access to live information.
You have web search available and should use it.
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
// OPENAI RESPONSES API + WEB SEARCH
// --------------------------------------------------

async function generateBrief(prompt) {
  console.log("Sending request to OpenAI with web search...");

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openAiKey}`
    },
    body: JSON.stringify({
      model: "gpt-5.6",
      tools: [
        {
          type: "web_search",
          user_location: {
            type: "approximate",
            country: "GB",
            city: "London",
            region: "London"
          }
        }
      ],
      input: prompt
    })
  });

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `OpenAI request failed: ${response.status} ${errorText}`
    );
  }

  const data = await response.json();

  // Extract final text from Responses API output
  let text = "";

  if (typeof data.output_text === "string") {
    text = data.output_text.trim();
  }

  // Fallback extraction if output_text is not included
  if (!text && Array.isArray(data.output)) {
    for (const item of data.output) {
      if (item.type === "message" && Array.isArray(item.content)) {
        for (const content of item.content) {
          if (
            content.type === "output_text" &&
            typeof content.text === "string"
          ) {
            text += content.text;
          }
        }
      }
    }

    text = text.trim();
  }

  if (!text) {
    console.log(JSON.stringify(data, null, 2));
    throw new Error("OpenAI returned an empty response.");
  }

  return text;
}

// --------------------------------------------------
// DISCORD MESSAGE SPLITTING
// --------------------------------------------------

function splitForDiscord(text, maxLength = 1850) {
  const chunks = [];
  let remaining = text.trim();

  while (remaining.length > maxLength) {
    let splitAt = remaining.lastIndexOf("\n\n", maxLength);

    if (splitAt < 700) {
      splitAt = remaining.lastIndexOf("\n", maxLength);
    }

    if (splitAt < 700) {
      splitAt = remaining.lastIndexOf(" ", maxLength);
    }

    if (splitAt < 700) {
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

  console.log(`Discord message parts: ${parts.length}`);

  for (let i = 0; i < parts.length; i++) {
    const prefix =
      parts.length > 1
        ? `**Part ${i + 1}/${parts.length}**\n\n`
        : "";

    const discordResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        content: prefix + parts[i]
      })
    });

    if (!discordResponse.ok) {
      const errorText = await discordResponse.text();

      throw new Error(
        `Discord webhook failed: ${discordResponse.status} ${errorText}`
      );
    }

    console.log(`Posted Discord part ${i + 1}/${parts.length}`);

    await new Promise(resolve => setTimeout(resolve, 800));
  }
}

// --------------------------------------------------
// RUN
// --------------------------------------------------

async function main() {
  console.log("----------------------------------------");
  console.log("FOREX FIRE DISCORD AUTOMATION");
  console.log("----------------------------------------");

  console.log(`Generating: ${briefType}`);

  const brief = await generateBrief(prompt);

  console.log("OpenAI report generated.");
  console.log(`Report length: ${brief.length} characters`);

  await postToDiscord(brief);

  console.log("----------------------------------------");
  console.log("Discord post complete.");
  console.log("----------------------------------------");
}

main().catch(error => {
  console.error("FOREX FIRE ERROR:");
  console.error(error);

  process.exit(1);
});
