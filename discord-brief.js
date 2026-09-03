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
// GLOBAL OUTPUT RULES
// --------------------------------------------------

const outputRules = `

STRICT OUTPUT RULES:

- Write the final report in ENGLISH ONLY.
- Never output Chinese, Japanese, Korean or other non-English source text.
- Research foreign-language sources if useful, but translate the information into clear English.
- DO NOT include URLs.
- DO NOT include clickable links.
- DO NOT include markdown source links.
- DO NOT include a Sources or References section.
- DO NOT reproduce web-search snippets.
- DO NOT include source preview text.
- Use research to establish facts, then write the Forex Fire report in your own concise English summary.
- Maximum target length: approximately 650 words.
- Keep each section short.
- Avoid repeating the same market theme in multiple sections.
- Prioritise information that can materially affect FX and Gold trading.
`;

// --------------------------------------------------
// SUNDAY WEEK AHEAD PROMPT
// --------------------------------------------------

const weekAheadPrompt = `
You are the Forex Fire market briefing assistant.

Today is ${ukDate}.
Current UK time is approximately ${ukTime}.
Timezone: Europe/London.

This is the SUNDAY FOREX FIRE WEEK AHEAD briefing.

You MUST use web search to research CURRENT information before writing the report.

The purpose of this report is to prepare forex and Gold traders for the COMING MONDAY TO FRIDAY TRADING WEEK.

This is NOT a Morning Brief.
This is NOT a trade signal service.
This is a macro, news, event-risk and market-theme preparation report.

RESEARCH THE COMING WEEK CAREFULLY.

Research:

- the confirmed economic calendar for the coming Monday-Friday
- major GBP events
- major EUR events
- major USD events
- major CAD events
- major JPY events
- major central-bank meetings
- major central-bank speeches
- inflation releases
- employment / labour-market releases
- GDP and growth data
- PMI / business activity data
- retail sales where important
- major US economic releases
- important UK releases
- important Eurozone releases
- important Canadian releases
- important Japanese releases
- current Federal Reserve themes
- current Bank of England themes
- current ECB themes
- current Bank of Japan themes
- current Bank of Canada themes
- current geopolitical risks
- current global risk sentiment
- current bond-yield / USD themes
- Gold / XAUUSD themes
- major market-moving stories that could carry into the new week

Use credible and current information.

VERY IMPORTANT:

Only include scheduled events you can verify.

Do NOT invent:
- calendar events
- event dates
- event times
- economic forecasts
- economic figures
- speeches
- market prices
- support or resistance levels
- currency moves
- central-bank decisions
- news events

If an event time cannot be confidently verified in UK time, do not invent it.

Focus on HIGH-IMPACT or genuinely market-relevant events.

Do not fill the report with minor calendar releases.

FORMAT EXACTLY LIKE THIS:

🔥 FOREX FIRE — WEEK AHEAD 🔥
${ukDate}

🌍 BIG PICTURE

Give a concise overview of the main macroeconomic and market themes traders are carrying into the new week.

Cover the most important themes only.

Examples may include:
- USD direction
- interest-rate expectations
- bond yields
- inflation expectations
- global risk sentiment
- geopolitical developments
- equity-market sentiment
- Gold themes

Do not invent price levels.


📅 WEEK'S KEY EVENTS

Give the most important confirmed market-moving events for the coming Monday-Friday.

Group them by day.

Example format:

MONDAY
UK TIME — EVENT — CURRENCY

TUESDAY
UK TIME — EVENT — CURRENCY

Continue only for days containing important events.

Prioritise:
GBP
EUR
USD
CAD
JPY

Do not list low-impact filler events.


🏦 CENTRAL BANK RADAR

Give a short summary of the important central-bank themes heading into the week.

Focus only where relevant:

🇺🇸 FED
Current policy / rate-expectation theme.

🇬🇧 BANK OF ENGLAND
Current policy / rate-expectation theme.

🇪🇺 ECB
Current policy / rate-expectation theme.

🇯🇵 BANK OF JAPAN
Current policy / rate-expectation theme.

🇨🇦 BANK OF CANADA
Current policy / rate-expectation theme.

Omit any bank where there is nothing meaningful to report.


💵 USD — WEEK AHEAD

Give the main fundamental drivers that could affect USD this week.

Keep it concise.


💷 GBP — WEEK AHEAD

Give the main fundamental drivers that could affect GBP this week.

Keep it concise.


💶 EUR — WEEK AHEAD

Give the main fundamental drivers that could affect EUR this week.

Keep it concise.


💴 JPY — WEEK AHEAD

Give the main fundamental drivers that could affect JPY this week.

Keep it concise.


🥇 GOLD — XAUUSD WEEK AHEAD

Explain the main fundamental themes that could affect Gold this week.

Consider where relevant:

- USD
- Treasury yields
- Fed expectations
- inflation
- risk sentiment
- geopolitical risk

Do NOT invent chart levels.


🔥 FOREX FIRE PAIRS TO WATCH

Select a maximum of 5 FX pairs or instruments that have a genuine fundamental reason to be interesting during the coming week.

You may include Gold.

For each use:

PAIR / INSTRUMENT
WHY IT MATTERS THIS WEEK

Keep each explanation very short.

Do NOT give entries.
Do NOT give stop losses.
Do NOT give take profits.
Do NOT invent technical levels.


⚠️ BIGGEST RISK EVENTS

Give a maximum of 4 events or themes most capable of creating significant volatility this week.

Use:

EVENT / THEME — WHY IT MATTERS


⚡ WEEKLY BIAS SNAPSHOT

USD:
GBP:
EUR:
JPY:
GOLD:

Use only:

Bullish / Bearish / Mixed

This is a broad fundamental / sentiment bias only.

Do not pretend this predicts the entire week's price direction.


🔥 FOREX FIRE WEEK AHEAD

Finish with one concise paragraph explaining what traders should pay most attention to as the new trading week begins.

Do NOT give trade signals.

Finish exactly with:

Market analysis only — not financial advice.

${outputRules}
`;

// --------------------------------------------------
// MORNING PROMPT
// --------------------------------------------------

const morningPrompt = `
You are the Forex Fire market briefing assistant.

Today is ${ukDate}.
Current UK time is approximately ${ukTime}.
Timezone: Europe/London.

You MUST use web search to research CURRENT information for TODAY before writing this report.

Create a concise Forex Fire Morning Brief designed for forex traders preparing for the London session.

RESEARCH:

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

Use credible current information.

Do NOT invent:
- economic releases
- economic figures
- speeches
- market prices
- support/resistance levels
- currency moves
- news events

If something cannot be verified, leave it out.

FORMAT:

🔥 FOREX FIRE MORNING BRIEF — ${ukDate} 🔥

🌏 OVERNIGHT / ASIA RECAP
Give a very short factual summary of what happened overnight and during Asia that matters for FX and Gold.

📅 TODAY'S KEY EVENTS
List today's important scheduled economic events in UK time.

Focus primarily on:
GBP, EUR, USD, CAD, JPY and Gold.

Format:
UK TIME — EVENT — CURRENCY

Only include events you can verify.

💵 USD / MARKET SENTIMENT
Give today's current USD tone and broader risk sentiment.

💷 GBP
Give the current GBP theme.

💶 EUR
Give the current EUR theme.

💴 JPY
Give the current JPY theme.

🥇 GOLD — XAUUSD
Give a concise current Gold overview.
Do not invent chart levels.

🔥 LONDON MARKET WATCH
Give 3 to 5 instruments worth watching during London.

For each:
PAIR — WHY IT MATTERS TODAY

Do not give trade signals.

⚡ QUICK BIAS
USD:
GBP:
EUR:
JPY:
GOLD:

Use only:
Bullish / Bearish / Mixed

Finish exactly with:

Market analysis only — not financial advice.

${outputRules}
`;

// --------------------------------------------------
// NY PROMPT
// --------------------------------------------------

const nyPrompt = `
You are the Forex Fire market briefing assistant.

Today is ${ukDate}.
Current UK time is approximately ${ukTime}.
Timezone: Europe/London.

This is the FOREX FIRE LONDON RECAP + NEW YORK LOOK AHEAD.

You MUST use web search and research CURRENT information for TODAY before writing the report.

This is NOT a Morning Brief.

RESEARCH TODAY'S ACTUAL MARKET FIRST.

Research:

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

Use credible current information.

Do NOT invent:
- prices
- support/resistance numbers
- economic figures
- speeches
- market reactions
- currency strength
- news
- scheduled events

If something cannot be verified, omit it.

FORMAT:

🔥 FOREX FIRE — LONDON RECAP + NY LOOK AHEAD 🔥
${ukDate}

🇬🇧 LONDON SESSION RECAP
Give a short factual summary of what actually happened during London trading.

Cover only the important developments involving:
GBP
EUR
USD
JPY
Gold

Do not repeat the same explanation for several currencies.

📰 NEWS + MARKET REACTION
Include only the most important events that actually influenced today's market.

For each:

NEWS / DATA:
WHAT HAPPENED:
MARKET REACTION:

Maximum 3 major items unless a fourth event is genuinely important.

💧 LONDON LIQUIDITY / STRUCTURE
Give a short practical overview.

Potential themes include:
- London directional pressure
- USD flows
- risk-on / risk-off behaviour
- Gold behaviour
- major session reversals

Do not invent chart price levels.

🇺🇸 NEW YORK LOOK AHEAD
Explain the main themes that matter as New York approaches.

Focus on:
- USD
- US yields
- equities / risk sentiment
- Gold
- major FX themes

Keep this short and forward-looking.

📅 UPCOMING NEW YORK EVENTS
List only important US and Canadian events STILL TO COME today.

Use UK times.

Format:

UK TIME — EVENT — CURRENCY — IMPACT

Do not list events that have already happened.

🔥 NY MARKET WATCH
Give a maximum of 4 instruments genuinely worth watching for New York.

For each:

PAIR / INSTRUMENT
WHY IT MATTERS TODAY
WHAT TO WATCH FOR

Keep each one very short.

Do NOT invent exact price levels.
Do NOT give guaranteed trade signals.

⚡ QUICK BIAS SNAPSHOT
USD:
GBP:
EUR:
JPY:
GOLD:

Use only:
Bullish / Bearish / Mixed

Finish exactly with:

Market analysis only — not financial advice.

${outputRules}
`;

// --------------------------------------------------
// CHOOSE PROMPT
// --------------------------------------------------

let prompt;

switch (briefType) {
  case "week_ahead":
    prompt = weekAheadPrompt;
    break;

  case "ny":
    prompt = nyPrompt;
    break;

  case "morning":
  default:
    prompt = morningPrompt;
    break;
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

  let text = "";

  if (typeof data.output_text === "string") {
    text = data.output_text.trim();
  }

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
// DISCORD CLEAN-UP / SAFETY FILTER
// --------------------------------------------------

function containsCJK(text) {
  return /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af]/u.test(text);
}

function cleanForDiscord(text) {
  let cleaned = text;

  // Remove OpenAI-style inline citation markers if present.
  cleaned = cleaned.replace(/]*/g, "");

  // Turn markdown links into plain visible text.
  cleaned = cleaned.replace(
    /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
    "$1"
  );

  // Remove any remaining bare URLs.
  cleaned = cleaned.replace(/https?:\/\/\S+/g, "");

  // Remove source-preview artefacts.
  cleaned = cleaned
    .split("\n")
    .filter(line => {
      const trimmed = line.trim();

      if (/^(svg|image)$/i.test(trimmed)) {
        return false;
      }

      if (containsCJK(line)) {
        return false;
      }

      return true;
    })
    .join("\n");

  // Remove empty brackets left behind by removed citations.
  cleaned = cleaned.replace(/\(\s*\)/g, "");

  // Tidy excessive blank lines.
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");

  return cleaned.trim();
}

// --------------------------------------------------
// LENGTH SAFETY
// --------------------------------------------------

function enforceReasonableLength(text, maxChars = 5000) {
  if (text.length <= maxChars) {
    return text;
  }

  console.warn(
    `Report exceeded ${maxChars} characters. Trimming safely.`
  );

  let shortened = text.slice(0, maxChars);

  const lastParagraph = shortened.lastIndexOf("\n\n");

  if (lastParagraph > 3000) {
    shortened = shortened.slice(0, lastParagraph);
  }

  shortened +=
    "\n\nMarket analysis only — not financial advice.";

  return shortened.trim();
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

  const rawBrief = await generateBrief(prompt);

  console.log("OpenAI report generated.");
  console.log(`Raw report length: ${rawBrief.length} characters`);

  let brief = cleanForDiscord(rawBrief);

  brief = enforceReasonableLength(brief);

  console.log(`Clean report length: ${brief.length} characters`);

  if (containsCJK(brief)) {
    throw new Error(
      "Safety check failed: non-English CJK characters remain in report."
    );
  }

  if (/https?:\/\//i.test(brief)) {
    throw new Error(
      "Safety check failed: URL remains in Discord report."
    );
  }

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
