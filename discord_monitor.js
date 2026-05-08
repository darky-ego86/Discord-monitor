/**
 * Discord Server Monitor
 * ======================
 * Monitors a Discord server for:
 *   - Keyword matches in messages
 *   - Members joining / leaving
 *   - Role changes on members
 *
 * Alerts are sent to a Discord webhook as rich embeds.
 *
 * Requirements:
 *   npm install discord.js
 *
 * Usage:
 *   1. Fill in the CONFIG section below (or use a .env file with dotenv).
 *   2. node discord_monitor.js
 */

const { Client, GatewayIntentBits, Events } = require("discord.js");

// ─────────────────────────────────────────────
//  CONFIG  (edit here or use environment vars)
// ─────────────────────────────────────────────
const CONFIG = {
  botToken:     process.env.DISCORD_BOT_TOKEN    || "YOUR_BOT_TOKEN_HERE",
  alertWebhook: process.env.DISCORD_ALERT_WEBHOOK || "YOUR_WEBHOOK_URL_HERE",

  // Keywords to watch for in messages (case-insensitive)
  keywords: ["scam", "raid", "hack", "abuse"],

  // Only monitor these channel IDs — leave empty [] to monitor ALL channels
  monitorChannels: [],

  // Only monitor these guild/server IDs — leave empty [] to monitor ALL guilds
  monitorGuilds: [],
};

// Embed accent colors (decimal)
const COLORS = {
  keyword: 0xFF4444,  // red    – keyword alert
  join:    0x43B581,  // green  – member joined
  leave:   0xFAA61A,  // amber  – member left
  role:    0x7289DA,  // blurple – role change
};
// ─────────────────────────────────────────────


// ── Webhook helper ────────────────────────────────────────────────────────────

async function sendAlert(embed) {
  try {
    const res = await fetch(CONFIG.alertWebhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [embed] }),
    });
    if (!res.ok) {
      const text = await res.text();
      console.warn(`[WARN] Webhook returned ${res.status}: ${text}`);
    }
  } catch (err) {
    console.error("[ERROR] Failed to send alert:", err.message);
  }
}

function nowISO() {
  return new Date().toISOString();
}

function guildOk(guildId) {
  return CONFIG.monitorGuilds.length === 0 || CONFIG.monitorGuilds.includes(guildId);
}

function channelOk(channelId) {
  return CONFIG.monitorChannels.length === 0 || CONFIG.monitorChannels.includes(channelId);
}


// ── Discord client ────────────────────────────────────────────────────────────

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});


// ── Ready ─────────────────────────────────────────────────────────────────────

client.once(Events.ClientReady, (c) => {
  console.log(`✅  Monitor online as ${c.user.tag}  |  watching ${c.guilds.cache.size} guild(s)`);
});


// ── Keyword monitor ───────────────────────────────────────────────────────────

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;
  if (!guildOk(message.guildId)) return;
  if (!channelOk(message.channelId)) return;

  const lower = message.content.toLowerCase();
  const triggered = CONFIG.keywords.filter((kw) => lower.includes(kw));
  if (triggered.length === 0) return;

  const embed = {
    title: "🚨 Keyword Alert",
    color: COLORS.keyword,
    timestamp: nowISO(),
    fields: [
      { name: "Server",   value: message.guild?.name ?? "Unknown",                   inline: true  },
      { name: "Channel",  value: `#${message.channel.name}`,                          inline: true  },
      { name: "Author",   value: `${message.author.tag} (\`${message.author.id}\`)`, inline: false },
      { name: "Keywords", value: triggered.map((k) => `\`${k}\``).join(", "),        inline: false },
      { name: "Message",  value: message.content.slice(0, 1024) || "*(empty)*",       inline: false },
      { name: "Jump",     value: message.url,                                          inline: false },
    ],
    footer: { text: "Discord Monitor" },
  };

  await sendAlert(embed);
  console.log(`[KEYWORD] ${message.author.tag} in #${message.channel.name}: [${triggered.join(", ")}]`);
});


// ── Member join ───────────────────────────────────────────────────────────────

client.on(Events.GuildMemberAdd, async (member) => {
  if (!guildOk(member.guild.id)) return;

  const accountAgeDays = Math.floor(
    (Date.now() - member.user.createdTimestamp) / 86_400_000
  );

  const embed = {
    title: "✅ Member Joined",
    color: COLORS.join,
    timestamp: nowISO(),
    thumbnail: { url: member.displayAvatarURL() },
    fields: [
      { name: "Server",       value: member.guild.name,                              inline: true },
      { name: "Member",       value: `${member.user.tag} (\`${member.id}\`)`,        inline: true },
      { name: "Account Age",  value: `${accountAgeDays} day(s)`,                     inline: true },
      { name: "Member Count", value: `${member.guild.memberCount}`,                  inline: true },
    ],
    footer: { text: "Discord Monitor" },
  };

  await sendAlert(embed);
  console.log(`[JOIN] ${member.user.tag} joined ${member.guild.name}`);
});


// ── Member leave ──────────────────────────────────────────────────────────────

client.on(Events.GuildMemberRemove, async (member) => {
  if (!guildOk(member.guild.id)) return;

  const roles = member.roles.cache
    .filter((r) => r.name !== "@everyone")
    .map((r) => r.name)
    .join(", ") || "None";

  const embed = {
    title: "👋 Member Left",
    color: COLORS.leave,
    timestamp: nowISO(),
    thumbnail: { url: member.displayAvatarURL() },
    fields: [
      { name: "Server", value: member.guild.name,                           inline: true  },
      { name: "Member", value: `${member.user.tag} (\`${member.id}\`)`,     inline: true  },
      { name: "Roles",  value: roles,                                        inline: false },
    ],
    footer: { text: "Discord Monitor" },
  };

  await sendAlert(embed);
  console.log(`[LEAVE] ${member.user.tag} left ${member.guild.name}`);
});


// ── Role changes ──────────────────────────────────────────────────────────────

client.on(Events.GuildMemberUpdate, async (before, after) => {
  if (!guildOk(after.guild.id)) return;

  const beforeRoles = new Set(before.roles.cache.keys());
  const afterRoles  = new Set(after.roles.cache.keys());

  const added   = [...afterRoles].filter((id) => !beforeRoles.has(id)).map((id) => after.guild.roles.cache.get(id));
  const removed = [...beforeRoles].filter((id) => !afterRoles.has(id)).map((id) => before.guild.roles.cache.get(id));

  if (added.length === 0 && removed.length === 0) return;

  const fields = [
    { name: "Server", value: after.guild.name,                          inline: true  },
    { name: "Member", value: `${after.user.tag} (\`${after.id}\`)`,     inline: true  },
  ];

  if (added.length > 0)
    fields.push({ name: "Roles Added",   value: added.map((r)   => `<@&${r.id}> ${r.name}`).join("\n"), inline: false });
  if (removed.length > 0)
    fields.push({ name: "Roles Removed", value: removed.map((r) => `<@&${r.id}> ${r.name}`).join("\n"), inline: false });

  const embed = {
    title: "🔄 Role Change",
    color: COLORS.role,
    timestamp: nowISO(),
    thumbnail: { url: after.displayAvatarURL() },
    fields,
    footer: { text: "Discord Monitor" },
  };

  await sendAlert(embed);
  console.log(`[ROLE] ${after.user.tag}: +[${added.map((r) => r.name)}] -[${removed.map((r) => r.name)}]`);
});


// ── Start ─────────────────────────────────────────────────────────────────────

if (CONFIG.botToken === "YOUR_BOT_TOKEN_HERE") {
  console.error("❌  Please set your DISCORD_BOT_TOKEN in CONFIG or as an env var.");
  process.exit(1);
}

client.login(CONFIG.botToken);

