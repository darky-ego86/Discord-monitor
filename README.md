# 🔍 Discord Server Monitor

A lightweight, self-hosted Discord bot that monitors your server and fires rich webhook alerts for keywords, member joins/leaves, and role changes — no third-party bot required.

---

## ✨ Features

| Event | What it detects |
|---|---|
| 🚨 **Keyword Alert** | Messages containing any word from your watchlist |
| ✅ **Member Joined** | New members with account age (spot alt accounts) |
| 👋 **Member Left** | Departing members with their roles at time of leaving |
| 🔄 **Role Change** | Exactly which roles were added or removed from a member |

All alerts are sent as rich Discord embeds to a webhook channel of your choice.

---

## 📋 Requirements

- [Node.js](https://nodejs.org/) v18 or higher
- A Discord bot token
- A Discord webhook URL (the channel you want alerts sent to)

---

## ⚡ Quick Start

### 1. Clone & install

```bash
git clone https://github.com/your-username/discord-monitor.git
cd discord-monitor
npm install
```

### 2. Create your Discord bot

1. Go to [discord.com/developers/applications](https://discord.com/developers/applications)
2. Click **New Application** → give it a name
3. Go to **Bot** → click **Reset Token** → copy the token
4. Under **Privileged Gateway Intents**, enable:
   - ✅ Server Members Intent
   - ✅ Message Content Intent
5. Go to **OAuth2 → URL Generator**:
   - Scopes: `bot`
   - Permissions: `Read Messages/View Channels`
6. Open the generated URL and invite the bot to your server

### 3. Create a webhook

1. Open Discord → go to the channel you want alerts in
2. **Edit Channel → Integrations → Webhooks → New Webhook**
3. Copy the webhook URL

### 4. Configure

Open `discord_monitor.js` and edit the `CONFIG` block at the top:

```js
const CONFIG = {
  botToken:     "YOUR_BOT_TOKEN_HERE",
  alertWebhook: "YOUR_WEBHOOK_URL_HERE",

  keywords: ["scam", "raid", "hack", "abuse"],

  // Restrict to specific channel IDs (empty = all channels)
  monitorChannels: [],

  // Restrict to specific guild/server IDs (empty = all guilds)
  monitorGuilds: [],
};
```

Or use environment variables (recommended for security):

```bash
export DISCORD_BOT_TOKEN=your_token_here
export DISCORD_ALERT_WEBHOOK=your_webhook_url_here
```

### 5. Run

```bash
node discord_monitor.js
```

You should see:
```
✅  Monitor online as YourBot#1234  |  watching 1 guild(s)
```

---

## 🔧 Configuration Reference

| Option | Type | Description |
|---|---|---|
| `botToken` | `string` | Your Discord bot token |
| `alertWebhook` | `string` | Webhook URL to send alerts to |
| `keywords` | `string[]` | Words to watch for in messages (case-insensitive) |
| `monitorChannels` | `number[]` | Channel IDs to watch. Empty `[]` = all channels |
| `monitorGuilds` | `number[]` | Guild IDs to watch. Empty `[]` = all guilds |

### Getting IDs

Enable **Developer Mode** in Discord (Settings → Advanced → Developer Mode), then right-click any channel or server to **Copy ID**.

---

## 📁 Project Structure

```
discord-monitor/
├── discord_monitor.js   # Main bot script
├── package.json         # Dependencies
└── README.md            # This file
```

---

## 🚀 Running in the Background

### With PM2 (recommended)

```bash
npm install -g pm2
pm2 start discord_monitor.js --name discord-monitor
pm2 save
pm2 startup   # auto-start on reboot
```

### With screen

```bash
screen -S discord-monitor
node discord_monitor.js
# Detach: Ctrl+A then D
```

---

## 🛡️ Required Bot Permissions

| Permission | Why |
|---|---|
| Read Messages / View Channels | See messages in channels |
| Server Members Intent | Detect joins, leaves, and role changes |
| Message Content Intent | Read message text for keyword matching |

---

## 📝 Example Alerts

**Keyword alert** — fires when a watched word appears in a message, with a direct jump link.

**Member joined** — includes account age so you can spot suspicious brand-new accounts.

**Member left** — shows which roles the member had, useful for tracking mod actions.

**Role change** — shows exactly which roles were added or removed and by implication.

---

## 🤝 Contributing

Pull requests are welcome! Some ideas for extension:
- Message edit / delete logging
- Channel creation / deletion alerts
- Voice channel join / leave tracking
- Configurable cooldown to avoid alert spam

---

## 📜 License

MIT — use freely, modify as needed.
