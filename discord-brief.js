const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

if (!webhookUrl) {
  throw new Error("DISCORD_WEBHOOK_URL secret is missing.");
}

async function sendDiscordMessage(message) {
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      content: message
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Discord webhook failed: ${response.status} ${errorText}`
    );
  }
}

await sendDiscordMessage(
  "🔥 **FOREX FIRE DISCORD AUTOMATION TEST** 🔥\n\nGitHub Actions is now successfully connected to Discord."
);

console.log("Discord test message sent successfully.");
