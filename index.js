const fs = require('fs');
const path = require('path');
const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  Events,
  StringSelectMenuBuilder,
  ChannelType,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  PermissionFlagsBits,
  Partials
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

const ADMIN_ROLE_ID = '1310984358991106120';
const STAFF_ROLE_ID = '1310342652058800138';
const TICKET_ACCESS_ROLE_ID = '1310384527952056401';
const TICKET_CATEGORY = '1495800617204187216';
const ORDER_CATEGORY = '1495800432776446063';
const ORDER_DONE_CATEGORY = '1499779941934436403';
const SUPPORT_CATEGORY = '1499036733986308146';
const TICKET_ARCHIVE_CATEGORY = '1499765419399970908';
const SHOP_CHANNEL_ID = '1310381741218988122';
const SUPPORT_CHANNEL_ID = '1498434089450078258';
const LOG_CHANNEL_ID = '1310354201704136747';
const ADMIN_COMMAND_LOG_CHANNEL_ID = '1499758004797702225';
const INVITE_ANNOUNCE_CHANNEL_ID = '1310355769824383059';
const INVITE_ADMIN_CHANNEL_ID = '1499523428112142568';
const RULES_ROLE_ID = '1310359454377840650';
const DELETE_DELAY = 10_000;
const ARCHIVED_TICKET_TTL = 24 * 60 * 60 * 1000;

const SHOP_EMOJI = '🛒';
const MCDONALDS_EMOJI_ID = '1498440076257136830';
const MCDONALDS_EMOJI_NAME = '4964mcdonalds';
const MCDONALDS_EMOJI = `<:${MCDONALDS_EMOJI_NAME}:${MCDONALDS_EMOJI_ID}>`;
const MCDONALDS_BUTTON_EMOJI = { id: MCDONALDS_EMOJI_ID, name: MCDONALDS_EMOJI_NAME };
const INFO_IMAGE = process.env.INFO_IMAGE || 'https://media.discordapp.net/attachments/1499072550985269268/1499121030491541585/IMG_1333.jpg?ex=69f4f641&is=69f3a4c1&hm=1f19f9ceb27d07466a27fcb29c1fe6fd35d2699006a35d395e827735eb547bee&=&format=webp&width=623&height=944';
const PAYPAL_LINK = 'https://www.paypal.me/LaRenta23';
const REVOLUT_LINK = 'https://revolut.me/arthur23320/pocket/vNrIna0VcG';
const IBAN = 'FR76 2823 3000 0165 8385 8232 516';
const NO_NOTE_TEXT = '❗❗ Ne mettre aucune note lors du paiement ❗❗';
const WALLET_FILE = 'wallets.json';
const WALLET_BACKUP_DIR = path.join('backups', 'wallets');
const WALLET_BACKUP_LIMIT = 50;
const WARNINGS_FILE = 'warnings.json';
const AUTO_MOD_NOTICE_DELAY = 7_000;
const WARNING_SANCTIONS = [
  { warns: 1, label: 'Rappel en MP', timeout: 0 },
  { warns: 2, label: 'Timeout 10 minutes', timeout: 10 * 60 * 1000 },
  { warns: 3, label: 'Timeout 1 heure', timeout: 60 * 60 * 1000 },
  { warns: 4, label: 'Timeout 24 heures', timeout: 24 * 60 * 60 * 1000 },
  { warns: 5, label: 'Ban définitif', ban: true }
];

const DISCORD_AD_REGEXES = [
  /(?:https?:\/\/)?(?:www\.)?(?:discord\.gg|discord(?:app)?\.com\/invite)\/[a-z0-9-]+/i,
  /\b(?:rejoins?|venez|viens|join)\b.{0,40}\b(?:mon|notre|un)?\s*(?:serveur|discord)\b/i,
  /\bmp\s+pour\s+(?:serveur|discord)\b/i,
  /\b(?:mon|notre)\s+serveur\s+discord\b/i
];

const SOCIAL_LINK_REGEX = /(?:https?:\/\/)?(?:www\.)?(?:tiktok\.com|vm\.tiktok\.com|instagram\.com|instagr\.am|snapchat\.com|youtube\.com|youtu\.be|x\.com|twitter\.com|telegram\.me|t\.me|whatsapp\.com|wa\.me|facebook\.com|fb\.com|twitch\.tv|kick\.com|linktr\.ee|guns\.lol|bio\.link|beacons\.ai|solo\.to)\b/i;
const SOCIAL_COMPACT_DOMAINS = [
  'tiktokcom',
  'vmtiktokcom',
  'instagramcom',
  'instagram',
  'snapchatcom',
  'youtubecom',
  'youtubebe',
  'twittercom',
  'telegramme',
  'whatsappcom',
  'facebookcom',
  'twitchtv',
  'kickcom',
  'linktree',
  'gunslol',
  'biolink',
  'beaconsai',
  'soloto'
];
const SOCIAL_AD_REGEXES = [
  /\b(?:mon|ma|mes)\s+(?:snap|snapchat|insta|instagram|tiktok|youtube|chaine|chaîne|telegram|twitter|twitch|kick)\b/i,
  /\b(?:ajoute|ajoutez)\s+moi\s+sur\s+(?:snap|snapchat|insta|instagram|tiktok|telegram|twitter)\b/i,
  /\b(?:abonne|abonnez|follow)\s+(?:toi|moi)\b/i,
  /\b(?:va|allez)\s+voir\s+(?:mon|ma)\s+(?:tiktok|insta|instagram|chaine|chaîne|youtube)\b/i
];

const SEVERE_INSULT_REGEXES = [
  /\b(?:fils\s+de\s+p(?:ute)?)\b/i,
  /\b(?:fdp|ntm)\b/i,
  /\bpute\b/i,
  /\bsalope\b/i,
  /\bpetasse\b/i,
  /\bchiennasse\b/i,
  /\bencule(?:e|es|s)?\b/i,
  /\bbatard(?:e|es|s)?\b/i,
  /\benfoire(?:e|es|s)?\b/i,
  /\b(?:nique|nike)\s+ta\s+mere\b/i,
  /\bva\s+te\s+faire\s+foutre\b/i,
  /\bva\s+crever\b/i,
  /\bcreve\b/i,
  /\bsuicide\s+toi\b/i
];
const SEVERE_INSULT_COMPACT = [
  'fdp',
  'ntm',
  'filsdepute',
  'niquetamere',
  'niketamere',
  'vatefairefoutre',
  'vacrever',
  'suicidetoi'
];

function ensureDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function backupTimestamp() {
  return `${new Date().toISOString().replace(/[:.]/g, '-')}-${Math.random().toString(36).slice(2, 8)}`;
}

function listJsonBackups(backupDir) {
  if (!fs.existsSync(backupDir)) return [];

  return fs.readdirSync(backupDir)
    .filter(file => file.endsWith('.json'))
    .map(file => {
      const filePath = path.join(backupDir, file);
      try {
        return {
          filePath,
          mtimeMs: fs.statSync(filePath).mtimeMs
        };
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .sort((a, b) => b.mtimeMs - a.mtimeMs);
}

function cleanupBackups(backupDir, limit) {
  listJsonBackups(backupDir)
    .slice(limit)
    .forEach(backup => {
      try {
        fs.unlinkSync(backup.filePath);
      } catch (error) {
        console.error(`Impossible de supprimer une ancienne sauvegarde : ${backup.filePath}`, error);
      }
    });
}

function backupJsonSnapshot(fileName, backupDir) {
  if (!fs.existsSync(fileName)) return null;

  ensureDirectory(backupDir);

  const parsed = path.parse(fileName);
  const backupPath = path.join(backupDir, `${parsed.name}-${backupTimestamp()}.json`);
  fs.copyFileSync(fileName, backupPath);
  cleanupBackups(backupDir, WALLET_BACKUP_LIMIT);
  return backupPath;
}

function loadLatestJsonBackup(backupDir) {
  for (const backup of listJsonBackups(backupDir)) {
    try {
      return JSON.parse(fs.readFileSync(backup.filePath, 'utf8'));
    } catch (error) {
      console.error(`Sauvegarde illisible ignorée : ${backup.filePath}`, error);
    }
  }

  return null;
}

function loadJsonFile(fileName, fallback, options = {}) {
  if (!fs.existsSync(fileName)) return fallback;

  try {
    return JSON.parse(fs.readFileSync(fileName, 'utf8'));
  } catch (error) {
    const backupName = `${fileName}.broken-${Date.now()}`;
    console.error(`Impossible de lire ${fileName}. Copie de secours : ${backupName}`, error);

    try {
      fs.copyFileSync(fileName, backupName);
    } catch (backupError) {
      console.error(`Impossible de créer la copie de secours ${backupName}`, backupError);
    }

    if (options.backupDir) {
      const backupData = loadLatestJsonBackup(options.backupDir);

      if (backupData) {
        console.log(`Récupération de ${fileName} depuis la dernière sauvegarde valide.`);
        return backupData;
      }
    }

    return fallback;
  }
}

function saveJsonFile(fileName, data, options = {}) {
  let tempFile = null;

  try {
    tempFile = `${fileName}.tmp-${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2));
    fs.renameSync(tempFile, fileName);

    if (options.backupDir) {
      backupJsonSnapshot(fileName, options.backupDir);
    }

    return true;
  } catch (error) {
    if (tempFile && fs.existsSync(tempFile)) {
      try {
        fs.unlinkSync(tempFile);
      } catch (cleanupError) {
        console.error(`Impossible de supprimer le fichier temporaire ${tempFile}`, cleanupError);
      }
    }

    console.error(`Impossible de sauvegarder ${fileName}`, error);
    reportCrash('Sauvegarde JSON impossible', error, [`Fichier : \`${fileName}\``]);
    return false;
  }
}

let wallets = loadJsonFile(WALLET_FILE, {}, { backupDir: WALLET_BACKUP_DIR });
let requests = loadJsonFile('requests.json', { counter: 0, tickets: {} });
let referrals = loadJsonFile('referrals.json', { invitedBy: {}, stats: {}, inviteLinks: {} });
let warnings = loadJsonFile(WARNINGS_FILE, { users: {} });

if (fs.existsSync(WALLET_FILE)) {
  try {
    backupJsonSnapshot(WALLET_FILE, WALLET_BACKUP_DIR);
  } catch (error) {
    console.error('Impossible de créer la sauvegarde initiale du portefeuille.', error);
  }
}

if (!referrals.inviteLinks) referrals.inviteLinks = {};
if (!warnings.users) warnings.users = {};

const pendingRecharges = new Map();
const guildInviteUses = new Map();
const crashReportCooldowns = new Map();
const archivedTicketCleanupTimers = new Map();
const CRASH_LOG_COOLDOWN = 60_000;

function saveWallets() {
  saveJsonFile(WALLET_FILE, wallets, { backupDir: WALLET_BACKUP_DIR });
}

function saveRequests() {
  saveJsonFile('requests.json', requests);
}

function saveReferrals() {
  saveJsonFile('referrals.json', referrals);
}

function saveWarnings() {
  saveJsonFile(WARNINGS_FILE, warnings);
}

function isAdminMember(member) {
  return Boolean(
    member?.roles?.cache?.has(ADMIN_ROLE_ID) ||
    member?.permissions?.has?.(PermissionFlagsBits.Administrator)
  );
}

function createRequest(type, channelId, userId, data = {}) {
  requests.counter += 1;
  const prefix = type === 'recharge' ? 'R' : type === 'support' ? 'S' : 'C';
  const request = {
    id: `${prefix}-${String(requests.counter).padStart(4, '0')}`,
    type,
    channelId,
    userId,
    createdAt: Date.now(),
    ...data
  };

  requests.tickets[channelId] = request;
  saveRequests();
  return request;
}

function getTicketRequest(channelId) {
  return requests.tickets[channelId] || null;
}

function findOpenRechargeRequestByUser(userId) {
  return Object.values(requests.tickets)
    .reverse()
    .find(request => request.type === 'recharge' && request.userId === userId && !request.paidAt) || null;
}

function pendingRechargeKey(interaction) {
  return `${interaction.guildId}:${interaction.user.id}`;
}

function ensureReferralStats(userId) {
  if (!referrals.stats[userId]) {
    referrals.stats[userId] = {
      validated: 0,
      invitedUsers: [],
      milestones: {}
    };
  }

  if (!Array.isArray(referrals.stats[userId].invitedUsers)) {
    referrals.stats[userId].invitedUsers = [];
  }

  if (!referrals.stats[userId].milestones) {
    referrals.stats[userId].milestones = {};
  }

  return referrals.stats[userId];
}

function getReferralSummary(userId) {
  const invited = Object.entries(referrals.invitedBy)
    .filter(([, referral]) => referral.inviterId === userId)
    .map(([invitedUserId, referral]) => ({ invitedUserId, ...referral }));

  const validated = invited.filter(referral => referral.validated);
  const pending = invited.filter(referral => !referral.validated);

  return {
    invited,
    validated,
    pending,
    stats: ensureReferralStats(userId)
  };
}

function buildReferralLeaderboard() {
  const leaderboard = new Map();

  Object.values(referrals.invitedBy).forEach(referral => {
    if (!referral.inviterId) return;

    if (!leaderboard.has(referral.inviterId)) {
      leaderboard.set(referral.inviterId, { inviterId: referral.inviterId, validated: 0, pending: 0 });
    }

    const row = leaderboard.get(referral.inviterId);
    if (referral.validated) {
      row.validated += 1;
    } else {
      row.pending += 1;
    }
  });

  Object.entries(referrals.stats).forEach(([userId, stats]) => {
    if (!leaderboard.has(userId)) {
      leaderboard.set(userId, { inviterId: userId, validated: 0, pending: 0 });
    }

    leaderboard.get(userId).validated = Math.max(
      leaderboard.get(userId).validated,
      Number(stats.validated) || 0
    );
  });

  return [...leaderboard.values()]
    .filter(row => row.validated > 0 || row.pending > 0)
    .sort((a, b) => b.validated - a.validated || b.pending - a.pending)
    .slice(0, 10);
}

function formatReferralDate(timestamp) {
  if (!timestamp) return 'Non connue';
  return `<t:${Math.floor(timestamp / 1000)}:f>`;
}

function findPersonalInviteOwner(inviteCode) {
  return Object.entries(referrals.inviteLinks || {})
    .find(([, invite]) => invite?.code === inviteCode)?.[0] || null;
}

function normalizeReferralOwnersFromPersonalLinks() {
  let changed = false;

  Object.values(referrals.invitedBy).forEach(referral => {
    const ownerId = findPersonalInviteOwner(referral.inviteCode);
    if (ownerId && referral.inviterId !== ownerId) {
      referral.inviterId = ownerId;
      changed = true;
    }
  });

  if (changed) saveReferrals();
}

async function getOrCreatePersonalInvite(guild, user) {
  const existing = referrals.inviteLinks[user.id];

  if (existing?.code) {
    const invite = await client.fetchInvite(existing.code).catch(() => null);
    if (invite) return invite;
  }

  const channel = guild.channels.cache.get(SHOP_CHANNEL_ID)
    || await guild.channels.fetch(SHOP_CHANNEL_ID).catch(() => null);

  if (!channel || typeof channel.createInvite !== 'function') {
    throw new Error('Salon boutique introuvable ou invitations impossibles.');
  }

  const invite = await channel.createInvite({
    maxAge: 0,
    maxUses: 0,
    unique: true,
    reason: `Lien de parrainage pour ${user.tag}`
  });

  referrals.inviteLinks[user.id] = {
    code: invite.code,
    url: invite.url,
    channelId: channel.id,
    createdAt: Date.now()
  };
  saveReferrals();

  await cacheGuildInvites(guild);
  return invite;
}

async function cacheGuildInvites(guild) {
  const invites = await guild.invites.fetch().catch(error => {
    console.error('Impossible de charger les invitations :', error.message);
    return null;
  });

  if (!invites) return null;

  const uses = new Map();
  invites.forEach(invite => {
    uses.set(invite.code, invite.uses || 0);
  });

  guildInviteUses.set(guild.id, uses);
  return invites;
}

async function recordMemberInvite(member) {
  const beforeUses = guildInviteUses.get(member.guild.id) || new Map();
  const invites = await member.guild.invites.fetch().catch(error => {
    console.error('Impossible de vérifier l’invitation utilisée :', error.message);
    return null;
  });

  if (!invites) return null;

  let usedInvite = null;
  invites.forEach(invite => {
    const previousUses = beforeUses.get(invite.code) || 0;
    if ((invite.uses || 0) > previousUses) {
      usedInvite = invite;
    }
  });

  const newUses = new Map();
  invites.forEach(invite => {
    newUses.set(invite.code, invite.uses || 0);
  });
  guildInviteUses.set(member.guild.id, newUses);

  if (!usedInvite) {
    return null;
  }

  const personalInviteOwnerId = findPersonalInviteOwner(usedInvite.code);
  const inviterId = personalInviteOwnerId || usedInvite.inviter?.id;

  if (!inviterId || inviterId === member.id || (!personalInviteOwnerId && inviterId === client.user?.id)) {
    return null;
  }

  if (!referrals.invitedBy[member.id]) {
    referrals.invitedBy[member.id] = {
      guildId: member.guild.id,
      inviterId,
      inviteCode: usedInvite.code,
      joinedAt: Date.now(),
      validated: false,
      rewardedAt: null
    };
    saveReferrals();
  }

  return referrals.invitedBy[member.id];
}

async function validateReferralReward(user, ticketRequest, amountText) {
  const referral = referrals.invitedBy[user.id];
  if (!referral || referral.validated || !referral.inviterId || referral.inviterId === user.id) {
    return null;
  }

  const inviter = await client.users.fetch(referral.inviterId).catch(() => null);
  if (!inviter) return null;

  const stats = ensureReferralStats(inviter.id);
  stats.validated += 1;
  if (!stats.invitedUsers.includes(user.id)) {
    stats.invitedUsers.push(user.id);
  }

  referral.validated = true;
  referral.rewardedAt = Date.now();
  referral.rechargeRequestId = ticketRequest.id;
  referral.firstRechargeAmount = amountText;

  let baseReward = 1;
  let bonusReward = 0;
  const bonusLines = [];

  if (stats.validated === 5 && !stats.milestones.five) {
    bonusReward += 5;
    stats.milestones.five = true;
    bonusLines.push('5 filleuls validés : **+5.00€**');
  }

  if (stats.validated === 10 && !stats.milestones.ten) {
    bonusReward += 7;
    stats.milestones.ten = true;
    bonusLines.push('10 filleuls validés : **+7.00€**');
  }

  const totalReward = baseReward + bonusReward;
  if (!wallets[inviter.id]) wallets[inviter.id] = { balance: 0 };
  wallets[inviter.id].balance += totalReward;

  saveWallets();
  saveReferrals();

  const newBalanceText = `${wallets[inviter.id].balance.toFixed(2)}€`;
  const rewardText = `${totalReward.toFixed(2)}€`;

  const dmEmbed = new EmbedBuilder()
    .setColor(0x2ECC71)
    .setTitle('🎁 Parrainage validé')
    .setDescription([
      'Un de tes filleuls vient de valider sa première recharge.',
      '',
      `👤 Filleul : **${user.tag}**`,
      `🧾 Demande : n°${ticketRequest.id}`,
      `💰 Récompense de base : **+${baseReward.toFixed(2)}€**`,
      ...bonusLines,
      '',
      `🎁 Total ajouté : **+${rewardText}**`,
      `👥 Filleuls validés : **${stats.validated}**`,
      `👛 Nouveau solde : **${newBalanceText}**`
    ].join('\n'));

  await inviter.send({ embeds: [dmEmbed] }).catch(() => {});

  await user.send({
    embeds: [
      new EmbedBuilder()
        .setColor(0x2ECC71)
        .setTitle('✅ Parrainage confirmé')
        .setDescription([
          'Ta première recharge a validé ton parrainage.',
          `Ton parrain **${inviter.tag}** a reçu sa récompense automatiquement.`
        ].join('\n'))
    ]
  }).catch(() => {});

  sendAdminLog('🎁 Parrainage récompensé', [
    `Parrain : ${logUser(inviter)}`,
    `Filleul : ${logUser(user)}`,
    `Demande recharge : **${ticketRequest.id}**`,
    `Filleuls validés : **${stats.validated}**`,
    `Récompense totale : **${rewardText}**`,
    `Nouveau solde parrain : **${newBalanceText}**`
  ], 0x2ECC71);

  return {
    inviter,
    stats,
    totalReward,
    newBalanceText
  };
}

const products = [
  { label: 'McDonald\'s 50-74 Points', description: '2€', value: '50_74', price: 2 },
  { label: 'McDonald\'s 75-99 Points', description: '4€', value: '75_99', price: 4 },
  { label: 'McDonald\'s 100-124 Points', description: '6€', value: '100_124', price: 6 },
  { label: 'McDonald\'s 125-149 Points', description: '7€', value: '125_149', price: 7 },
  { label: 'McDonald\'s 150-174 Points', description: '8€', value: '150_174', price: 8 },
  { label: 'McDonald\'s 175-199 Points', description: '10€', value: '175_199', price: 10 },
  { label: 'McDonald\'s 200-224 Points', description: '11€', value: '200_224', price: 11 },
  { label: 'McDonald\'s 225-249 Points', description: '12€', value: '225_249', price: 12 },
  { label: 'McDonald\'s 250-274 Points', description: '13€', value: '250_274', price: 13 },
  { label: 'McDonald\'s 275-299 Points', description: '14€', value: '275_299', price: 14 },
  { label: 'McDonald\'s 300-324 Points', description: '15€', value: '300_324', price: 15 },
  { label: 'McDonald\'s 325-349 Points', description: '16€', value: '325_349', price: 16 },
  { label: 'McDonald\'s 350-374 Points', description: '17€', value: '350_374', price: 17 },
  { label: 'McDonald\'s 400-499 Points', description: '18€', value: '400_499', price: 18 },
  { label: 'McDonald\'s 500-599 Points', description: '21€', value: '500_599', price: 21 },
  { label: 'McDonald\'s 600-699 Points', description: '30€', value: '600_699', price: 30 },
  { label: 'McDonald\'s 700-799 Points', description: '34€', value: '700_799', price: 34 },
  { label: 'McDonald\'s 800-899 Points', description: '40€', value: '800_899', price: 40 },
  { label: 'McDonald\'s 1000-1099 Points', description: '51€', value: '1000_1099', price: 51 },
  { label: 'McDonald\'s 1100-1199 Points', description: '67€', value: '1100_1199', price: 67 }
];

const prices = Object.fromEntries(products.map(product => [product.value, product.price]));
const ticketAllow = [
  PermissionFlagsBits.ViewChannel,
  PermissionFlagsBits.SendMessages,
  PermissionFlagsBits.ReadMessageHistory
];

function ticketPermissionOverwrites(guild, userId) {
  return [
    { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
    { id: userId, allow: ticketAllow },
    { id: STAFF_ROLE_ID, allow: ticketAllow },
    { id: TICKET_ACCESS_ROLE_ID, allow: ticketAllow },
    { id: ADMIN_ROLE_ID, allow: ticketAllow }
  ];
}

function adminTicketPermissionOverwrites(guild) {
  return [
    { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
    { id: ADMIN_ROLE_ID, allow: ticketAllow }
  ];
}

function supportTicketPermissionOverwrites(guild, userId) {
  return [
    { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
    { id: userId, allow: ticketAllow },
    { id: TICKET_ACCESS_ROLE_ID, allow: ticketAllow },
    { id: ADMIN_ROLE_ID, allow: ticketAllow }
  ];
}

function completedOrderTicketPermissionOverwrites(guild, userId) {
  return [
    { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
    { id: userId, allow: ticketAllow },
    { id: TICKET_ACCESS_ROLE_ID, allow: ticketAllow },
    { id: ADMIN_ROLE_ID, allow: ticketAllow }
  ];
}

function archivedTicketPermissionOverwrites(guild, ticketRequest) {
  return [
    { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
    { id: ADMIN_ROLE_ID, allow: ticketAllow }
  ];
}

function ticketParentForType(type) {
  if (type === 'recharge') return TICKET_CATEGORY;
  if (type === 'support') return SUPPORT_CATEGORY;
  return ORDER_CATEGORY;
}

function restoreTicketPermissionOverwrites(guild, ticketRequest, ownerId) {
  const resolvedOwnerId = ticketRequest?.userId || ownerId;

  if (ticketRequest?.type === 'recharge') {
    return adminTicketPermissionOverwrites(guild);
  }

  if (ticketRequest?.type === 'support') {
    return supportTicketPermissionOverwrites(guild, resolvedOwnerId);
  }

  return ticketPermissionOverwrites(guild, resolvedOwnerId);
}

function canManageTicket(interaction, ownerId) {
  return (
    interaction.user.id === ownerId ||
    interaction.member.roles.cache.has(STAFF_ROLE_ID) ||
    interaction.member.roles.cache.has(ADMIN_ROLE_ID) ||
    interaction.member.permissions.has(PermissionFlagsBits.Administrator)
  );
}

function canCompleteOrderTicket(member) {
  return Boolean(
    isAdminMember(member) ||
    member?.roles?.cache?.has(TICKET_ACCESS_ROLE_ID)
  );
}

function ticketButtons(ownerId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`delete_ticket:${ownerId}`)
      .setLabel('Supprimer le ticket')
      .setEmoji('🗑️')
      .setStyle(ButtonStyle.Danger)
  );
}

function orderTicketButtons(ownerId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`complete_order:${ownerId}`)
      .setLabel('Commande terminée')
      .setEmoji('✅')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`delete_ticket:${ownerId}`)
      .setLabel('Supprimer le ticket')
      .setEmoji('🗑️')
      .setStyle(ButtonStyle.Danger)
  );
}

function ticketButtonsForRequest(ticketRequest, ownerId) {
  if (ticketRequest?.type === 'commande' && !ticketRequest.completedAt) {
    return orderTicketButtons(ownerId);
  }

  return ticketButtons(ownerId);
}

function archivedTicketButtons(ownerId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`reopen_ticket:${ownerId}`)
      .setLabel('Réouvrir le ticket')
      .setEmoji('🔓')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`delete_ticket:${ownerId}`)
      .setLabel('Supprimer définitivement')
      .setEmoji('🗑️')
      .setStyle(ButtonStyle.Danger)
  );
}

function isTicketArchived(channel, ticketRequest) {
  return Boolean(ticketRequest?.archivedAt || channel.parentId === TICKET_ARCHIVE_CATEGORY);
}

function clearArchivedTicketCleanup(channelId) {
  const timer = archivedTicketCleanupTimers.get(channelId);
  if (!timer) return;

  clearTimeout(timer);
  archivedTicketCleanupTimers.delete(channelId);
}

function scheduleArchivedTicketCleanup(channelId, archivedAt = Date.now()) {
  clearArchivedTicketCleanup(channelId);

  const deleteAt = Number(archivedAt) + ARCHIVED_TICKET_TTL;
  const delay = Math.max(deleteAt - Date.now(), 0);
  const timer = setTimeout(() => {
    deleteArchivedTicketChannel(channelId, '24h écoulées')
      .catch(error => reportCrash('Suppression auto ticket archivé impossible', error, [
        `Ticket : <#${channelId}> (${channelId})`
      ]));
  }, delay);

  archivedTicketCleanupTimers.set(channelId, timer);
}

function scheduleCompletedOrderTicketCleanup(channelId, completedAt = Date.now()) {
  clearArchivedTicketCleanup(channelId);

  const deleteAt = Number(completedAt) + ARCHIVED_TICKET_TTL;
  const delay = Math.max(deleteAt - Date.now(), 0);
  const timer = setTimeout(() => {
    deleteCompletedOrderTicketChannel(channelId, '24h après commande terminée')
      .catch(error => reportCrash('Suppression auto commande terminée impossible', error, [
        `Ticket : <#${channelId}> (${channelId})`
      ]));
  }, delay);

  archivedTicketCleanupTimers.set(channelId, timer);
}

async function deleteArchivedTicketChannel(channelId, reason) {
  clearArchivedTicketCleanup(channelId);

  const ticketRequest = getTicketRequest(channelId);
  const channel = client.channels.cache.get(channelId)
    || await client.channels.fetch(channelId).catch(() => null);

  if (!channel) {
    if (ticketRequest?.archivedAt) {
      delete requests.tickets[channelId];
      saveRequests();
    }
    return;
  }

  if (!isTicketArchived(channel, ticketRequest)) return;

  await sendAdminLog('🗑️ Ticket supprimé automatiquement', [
    `Raison : **${reason}**`,
    `Ticket : ${logChannel(channel)}`,
    ticketRequest ? `Demande : **${ticketRequest.id}**` : 'Demande : inconnue',
    ticketRequest ? `Type : **${ticketRequest.type}**` : null,
    ticketRequest ? `Client : <@${ticketRequest.userId}>` : null
  ], 0xE74C3C);

  const deleted = await channel.delete(`Ticket archivé supprimé automatiquement : ${reason}`)
    .then(() => true)
    .catch(async error => {
      await reportCrash('Suppression auto ticket archivé impossible', error, [
        `Ticket : ${logChannel(channel)}`,
        ticketRequest ? `Demande : **${ticketRequest.id}**` : 'Demande : inconnue'
      ]);
      return false;
    });

  if (!deleted) return;

  delete requests.tickets[channelId];
  saveRequests();
}

async function deleteCompletedOrderTicketChannel(channelId, reason) {
  clearArchivedTicketCleanup(channelId);

  const ticketRequest = getTicketRequest(channelId);

  if (
    !ticketRequest ||
    ticketRequest.type !== 'commande' ||
    !ticketRequest.completedAt ||
    ticketRequest.archivedAt
  ) {
    return;
  }

  const channel = client.channels.cache.get(channelId)
    || await client.channels.fetch(channelId).catch(() => null);

  if (!channel) {
    delete requests.tickets[channelId];
    saveRequests();
    return;
  }

  if (channel.parentId !== ORDER_DONE_CATEGORY) return;

  await sendAdminLog('🗑️ Commande terminée supprimée automatiquement', [
    `Raison : **${reason}**`,
    `Ticket : ${logChannel(channel)}`,
    `Demande : **${ticketRequest.id}**`,
    `Client : <@${ticketRequest.userId}>`,
    `Produit : **${ticketRequest.product || 'Non précisé'}**`
  ], 0xE74C3C);

  const deleted = await channel.delete(`Commande terminée supprimée automatiquement : ${reason}`)
    .then(() => true)
    .catch(async error => {
      await reportCrash('Suppression auto commande terminée impossible', error, [
        `Ticket : ${logChannel(channel)}`,
        `Demande : **${ticketRequest.id}**`
      ]);
      return false;
    });

  if (!deleted) return;

  delete requests.tickets[channelId];
  saveRequests();
}

function scheduleTicketCleanups() {
  Object.entries(requests.tickets || {}).forEach(([channelId, ticketRequest]) => {
    if (ticketRequest?.archivedAt) {
      scheduleArchivedTicketCleanup(channelId, ticketRequest.archivedAt);
      return;
    }

    if (ticketRequest?.type === 'commande' && ticketRequest.completedAt) {
      scheduleCompletedOrderTicketCleanup(channelId, ticketRequest.completedAt);
    }
  });
}

async function archiveTicketChannel(channel, ticketRequest, user, ownerId = ticketRequest?.userId) {
  const archiveCategory = channel.guild.channels.cache.get(TICKET_ARCHIVE_CATEGORY)
    || await channel.guild.channels.fetch(TICKET_ARCHIVE_CATEGORY).catch(() => null);

  if (!archiveCategory || archiveCategory.type !== ChannelType.GuildCategory) {
    throw new Error('Catégorie des tickets supprimés introuvable.');
  }

  if (ticketRequest) {
    ticketRequest.originalParentId = ticketRequest.originalParentId || channel.parentId || ticketParentForType(ticketRequest.type);
    ticketRequest.archivedAt = Date.now();
    ticketRequest.archivedBy = user.id;
    saveRequests();
  }

  await channel.setParent(TICKET_ARCHIVE_CATEGORY, { lockPermissions: false });
  await channel.permissionOverwrites.set(archivedTicketPermissionOverwrites(channel.guild, ticketRequest));

  if (!channel.name.startsWith('archive-')) {
    await channel.setName(`archive-${channel.name}`.slice(0, 100)).catch(() => {});
  }

  await channel.send({
    embeds: [
      new EmbedBuilder()
        .setColor(0xE67E22)
        .setTitle('Ticket déplacé dans les tickets supprimés')
        .setDescription([
          `Déplacé par : ${user}`,
          ticketRequest ? `Demande : **${ticketRequest.id}**` : 'Demande : inconnue',
          '',
          'Tu peux le réouvrir si la suppression était une erreur, ou le supprimer définitivement.',
          '',
          'Sans réouverture, il sera supprimé automatiquement au bout de 24h.'
        ].join('\n'))
        .setTimestamp()
    ],
    components: [archivedTicketButtons(ownerId)]
  });

  scheduleArchivedTicketCleanup(channel.id, ticketRequest?.archivedAt || Date.now());
}

async function reopenTicketChannel(channel, ticketRequest, user, ownerId = ticketRequest?.userId) {
  const parentId = ticketRequest?.originalParentId || ticketParentForType(ticketRequest?.type);
  const targetCategory = channel.guild.channels.cache.get(parentId)
    || await channel.guild.channels.fetch(parentId).catch(() => null);

  if (!targetCategory || targetCategory.type !== ChannelType.GuildCategory) {
    throw new Error('Catégorie de réouverture introuvable.');
  }

  await channel.setParent(parentId, { lockPermissions: false });
  await channel.permissionOverwrites.set(restoreTicketPermissionOverwrites(channel.guild, ticketRequest, ownerId));

  if (channel.name.startsWith('archive-')) {
    await channel.setName(channel.name.replace(/^archive-/, '').slice(0, 100)).catch(() => {});
  }

  if (ticketRequest) {
    clearArchivedTicketCleanup(channel.id);
    ticketRequest.reopenedAt = Date.now();
    ticketRequest.reopenedBy = user.id;
    delete ticketRequest.archivedAt;
    delete ticketRequest.archivedBy;
    saveRequests();
  }

  await channel.send({
    embeds: [
      new EmbedBuilder()
        .setColor(0x2ECC71)
        .setTitle('Ticket réouvert')
        .setDescription(`Réouvert par : ${user}`)
        .setTimestamp()
    ],
    components: [ticketButtonsForRequest(ticketRequest, ownerId)]
  });
}

async function completeOrderTicketChannel(channel, ticketRequest, user, ownerId = ticketRequest?.userId) {
  const doneCategory = channel.guild.channels.cache.get(ORDER_DONE_CATEGORY)
    || await channel.guild.channels.fetch(ORDER_DONE_CATEGORY).catch(() => null);

  if (!doneCategory || doneCategory.type !== ChannelType.GuildCategory) {
    throw new Error('Catégorie des commandes terminées introuvable.');
  }

  const resolvedOwnerId = ticketRequest?.userId || ownerId;

  await channel.setParent(ORDER_DONE_CATEGORY, { lockPermissions: false });
  await channel.permissionOverwrites.set(completedOrderTicketPermissionOverwrites(channel.guild, resolvedOwnerId));

  if (!channel.name.startsWith('termine-')) {
    await channel.setName(`termine-${channel.name}`.slice(0, 100)).catch(() => {});
  }

  if (ticketRequest) {
    ticketRequest.completedAt = Date.now();
    ticketRequest.completedBy = user.id;
    ticketRequest.completedParentId = ORDER_DONE_CATEGORY;
    ticketRequest.originalParentId = ORDER_DONE_CATEGORY;
    saveRequests();
  }

  scheduleCompletedOrderTicketCleanup(channel.id, ticketRequest?.completedAt || Date.now());

  await channel.send({
    content: '🕒 Ce ticket commande sera supprimé automatiquement dans 24h.',
    embeds: [buildAvisEmbed()]
  });
}

function sanitizeChannelName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 30) || 'client';
}

function parseAmountToCents(value) {
  const amount = Number(value.trim().replace(',', '.'));
  if (!Number.isFinite(amount) || amount < 1 || amount > 200) return null;
  return Math.round(amount * 100);
}

function formatAmount(cents) {
  return `${(cents / 100).toFixed(2)}€`;
}

function paymentLabel(method) {
  return {
    paypal: 'PayPal',
    revolut: 'Revolut',
    virement: 'Virement'
  }[method] || method;
}

function paymentInstruction(method) {
  if (method === 'paypal') {
    return `ENVOIE ICI EN AMI PROCHE & SANS NOTES : ${PAYPAL_LINK} | Puis réponds à ce message en joignant ton screenshot PayPal (capture d'écran du paiement).`;
  }

  if (method === 'revolut') {
    return `ENVOIE ICI SANS NOTES : ${REVOLUT_LINK} | Puis réponds à ce message en joignant ton screenshot Revolut (capture d'écran du paiement).`;
  }

  if (method === 'virement') {
    return `EFFECTUE LE VIREMENT SANS NOTES : IBAN ${IBAN} | Puis réponds à ce message en joignant ton screenshot du virement.`;
  }

  return 'Puis réponds à ce message en joignant ton screenshot du paiement.';
}

function rechargeInstructionMessage(request) {
  const methodName = paymentLabel(request.method);

  return [
    `🧭 **Recharge ${methodName} — Étape 2/2**`,
    '',
    `Montant déclaré : **${request.amount}** | Demande n°**${request.id}**`,
    `Date indiquée : **${request.paymentDate || 'Non précisée'}** | Heure : **${request.paymentTime || 'Non précisée'}**`,
    '',
    `**${paymentInstruction(request.method)}**`,
    '⏳ Tu as **24h** pour l\'envoyer.'
  ].join('\n');
}

function deleteLater(message, delay = DELETE_DELAY) {
  setTimeout(() => {
    message.delete().catch(() => {});
  }, delay);
}

async function replyTemp(interaction, options, delay = DELETE_DELAY) {
  await interaction.reply(options);
  setTimeout(() => {
    interaction.deleteReply().catch(() => {});
  }, delay);
}

function productListText(options = {}) {
  const { boldRanges = false } = options;

  return products
    .map(product => {
      const label = boldRanges
        ? product.label.replace(/\b\d+-\d+\b/g, match => `**${match}**`)
        : product.label;

      return `💰  ${label.padEnd(15, ' ')} →   ${product.description}`;
    })
    .join('\n\n');
}

function buildAvisEmbed() {
  return new EmbedBuilder()
    .setColor(0xD4AF37)
    .setTitle('Merci pour ta commande')
    .setDescription([
      'Ta commande est terminée, merci pour ta confiance !',
      '',
      'N’hésite pas à laisser un avis ici : <#1497652398259306516>',
      'Et si tu as apprécié le service, parle-en autour de toi !',
      '',
      'Bon appétit 😋'
    ].join('\n'))
    .setFooter({ text: 'Boutique' });
}

async function sendLogToChannel(channelId, title, lines, color = 0x3498DB) {
  const channel = client.channels.cache.get(channelId)
    || await client.channels.fetch(channelId).catch(() => null);

  if (!channel || typeof channel.send !== 'function') return;

  const description = Array.isArray(lines)
    ? lines.filter(Boolean).join('\n')
    : String(lines || 'Aucun détail.');

  await channel.send({
    embeds: [
      new EmbedBuilder()
        .setColor(color)
        .setTitle(title)
        .setDescription(description.slice(0, 4096))
        .setTimestamp()
    ]
  }).catch(() => {});
}

function sendBotLog(title, lines, color = 0x3498DB) {
  return sendLogToChannel(LOG_CHANNEL_ID, title, lines, color);
}

function sendAdminLog(title, lines, color = 0x95A5A6) {
  return sendLogToChannel(ADMIN_COMMAND_LOG_CHANNEL_ID, title, lines, color);
}

function sendAdminCommandLog(title, lines, color = 0x95A5A6) {
  return sendAdminLog(title, lines, color);
}

function shouldUseStaffLog(member) {
  const roles = member?.roles?.cache;

  return Boolean(
    roles?.has(ADMIN_ROLE_ID) ||
    roles?.has(TICKET_ACCESS_ROLE_ID) ||
    member?.permissions?.has?.(PermissionFlagsBits.Administrator)
  );
}

function sendActionLog(member, title, lines, color = 0x3498DB) {
  return shouldUseStaffLog(member)
    ? sendAdminLog(title, lines, color)
    : sendBotLog(title, lines, color);
}

function canBypassAutoModeration(member) {
  return shouldUseStaffLog(member);
}

function normalizeModerationText(content) {
  const lowered = String(content || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[@]/g, 'a')
    .replace(/[!|]/g, 'i')
    .replace(/[$]/g, 's')
    .replace(/0/g, 'o')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/5/g, 's')
    .replace(/7/g, 't');

  return {
    raw: lowered,
    spaced: lowered.replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim(),
    compact: lowered.replace(/[^a-z0-9]/g, '')
  };
}

function hasDiscordAdvertisement(text) {
  return (
    DISCORD_AD_REGEXES.some(regex => regex.test(text.raw) || regex.test(text.spaced)) ||
    text.compact.includes('discordgg') ||
    text.compact.includes('discordcominvite') ||
    text.compact.includes('discordappcominvite')
  );
}

function hasSocialAdvertisement(text) {
  return (
    SOCIAL_LINK_REGEX.test(text.raw) ||
    SOCIAL_COMPACT_DOMAINS.some(domain => text.compact.includes(domain)) ||
    SOCIAL_AD_REGEXES.some(regex => regex.test(text.raw) || regex.test(text.spaced))
  );
}

function hasSevereInsult(text) {
  return (
    SEVERE_INSULT_REGEXES.some(regex => regex.test(text.spaced)) ||
    SEVERE_INSULT_COMPACT.some(word => text.compact.includes(word))
  );
}

function inspectAutoModeration(content) {
  const text = normalizeModerationText(content);

  if (hasDiscordAdvertisement(text)) {
    return {
      type: 'discord_ad',
      label: 'Pub serveur Discord',
      action: 'ban',
      channelNotice: '🚫 Pub Discord détectée : membre banni.'
    };
  }

  if (hasSocialAdvertisement(text)) {
    return {
      type: 'social_ad',
      label: 'Pub réseaux',
      action: 'dm_notice',
      channelNotice: '⚠️ Message supprimé : partage de réseau à faire en MP.'
    };
  }

  if (hasSevereInsult(text)) {
    return {
      type: 'severe_insult',
      label: 'Insulte interdite',
      action: 'warn',
      channelNotice: '⚠️ Message supprimé : insulte interdite.'
    };
  }

  return null;
}

function ensureWarningUser(userId) {
  if (!warnings.users[userId]) {
    warnings.users[userId] = {
      count: 0,
      entries: []
    };
  }

  if (!Array.isArray(warnings.users[userId].entries)) {
    warnings.users[userId].entries = [];
  }

  warnings.users[userId].count = warnings.users[userId].entries.length;
  return warnings.users[userId];
}

function warningSanctionFor(count) {
  if (count >= 5) return WARNING_SANCTIONS[4];
  return WARNING_SANCTIONS.find(sanction => sanction.warns === count) || WARNING_SANCTIONS[0];
}

function formatDurationMs(duration) {
  if (!duration) return 'Aucune';

  const minutes = Math.round(duration / 60_000);
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''}`;

  const hours = Math.round(duration / 3_600_000);
  return `${hours} heure${hours > 1 ? 's' : ''}`;
}

async function sendTemporaryChannelNotice(channel, content) {
  if (!channel || typeof channel.send !== 'function') return;

  const notice = await channel.send(content).catch(() => null);
  if (notice) deleteLater(notice, AUTO_MOD_NOTICE_DELAY);
}

async function sendModerationDm(user, title, lines) {
  return user.send({
    embeds: [
      new EmbedBuilder()
        .setColor(0xE67E22)
        .setTitle(title)
        .setDescription(lines.filter(Boolean).join('\n'))
        .setTimestamp()
    ]
  }).then(() => true).catch(() => false);
}

async function applyWarningSanction(message, violation) {
  const member = message.member;
  const userWarnings = ensureWarningUser(message.author.id);
  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: violation.type,
    reason: violation.label,
    channelId: message.channel.id,
    guildId: message.guild.id,
    message: message.content.slice(0, 1000),
    createdAt: Date.now()
  };

  userWarnings.entries.push(entry);
  userWarnings.count = userWarnings.entries.length;
  userWarnings.lastWarnAt = entry.createdAt;
  saveWarnings();

  const count = userWarnings.count;
  const sanction = warningSanctionFor(count);
  const dmSent = await sendModerationDm(message.author, 'Avertissement automatique', [
    `Serveur : **${message.guild.name}**`,
    `Raison : **${violation.label}**`,
    `Warns : **${count}/5**`,
    `Sanction : **${sanction.label}**`,
    '',
    'Merci de respecter le règlement du serveur.'
  ]);

  let sanctionResult = sanction.label;

  if (sanction.ban) {
    await member.ban({ reason: `Auto-mod : 5 warns - ${violation.label}` })
      .then(() => {
        sanctionResult = 'Ban définitif appliqué';
      })
      .catch(error => {
        sanctionResult = `Ban impossible : ${error.message}`;
      });
  } else if (sanction.timeout) {
    await member.timeout(sanction.timeout, `Auto-mod : ${count} warns - ${violation.label}`)
      .then(() => {
        sanctionResult = `Timeout ${formatDurationMs(sanction.timeout)} appliqué`;
      })
      .catch(error => {
        sanctionResult = `Timeout impossible : ${error.message}`;
      });
  }

  await sendTemporaryChannelNotice(
    message.channel,
    sanction.ban ? '🚫 Message supprimé : membre banni après 5 warns.' : violation.channelNotice
  );

  await sendAdminLog('⚠️ Auto-modération - warn', [
    `Membre : ${logUser(message.author)}`,
    `Salon : ${logChannel(message.channel)}`,
    `Raison : **${violation.label}**`,
    `Warns : **${count}/5**`,
    `Sanction : **${sanctionResult}**`,
    dmSent ? 'MP : envoyé' : 'MP : impossible à envoyer',
    '',
    `Message : \`${message.content.slice(0, 1000)}\``
  ], sanction.ban ? 0xE74C3C : 0xE67E22);
}

function addManualWarning(userId, data) {
  const userWarnings = ensureWarningUser(userId);
  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: 'manual',
    reason: data.reason || 'Aucune raison précisée',
    moderatorId: data.moderatorId,
    channelId: data.channelId,
    guildId: data.guildId,
    createdAt: Date.now()
  };

  userWarnings.entries.push(entry);
  userWarnings.count = userWarnings.entries.length;
  userWarnings.lastWarnAt = entry.createdAt;
  saveWarnings();

  return { userWarnings, entry };
}

function removeLatestWarnings(userId, amount = 1) {
  const userWarnings = ensureWarningUser(userId);
  const safeAmount = Math.max(1, Math.min(Number(amount) || 1, userWarnings.entries.length));
  const removed = userWarnings.entries.splice(-safeAmount, safeAmount);

  userWarnings.count = userWarnings.entries.length;
  userWarnings.lastWarnAt = userWarnings.entries.at(-1)?.createdAt || null;
  saveWarnings();

  return removed;
}

function clearUserWarnings(userId) {
  const userWarnings = ensureWarningUser(userId);
  const removedCount = userWarnings.entries.length;

  userWarnings.entries = [];
  userWarnings.count = 0;
  userWarnings.lastWarnAt = null;
  saveWarnings();

  return removedCount;
}

async function applyManualWarningSanction(guild, member, user, count, reason, moderator) {
  const sanction = warningSanctionFor(count);
  const dmSent = await sendModerationDm(user, 'Avertissement reçu', [
    `Serveur : **${guild.name}**`,
    `Raison : **${reason}**`,
    `Warns : **${count}/5**`,
    `Sanction : **${sanction.label}**`,
    `Modérateur : **${moderator.tag}**`,
    '',
    'Merci de respecter le règlement du serveur.'
  ]);

  let sanctionResult = sanction.label;

  if (sanction.ban) {
    await member.ban({ reason: `Warn manuel : 5 warns - ${reason}` })
      .then(() => {
        sanctionResult = 'Ban définitif appliqué';
      })
      .catch(error => {
        sanctionResult = `Ban impossible : ${error.message}`;
      });
  } else if (sanction.timeout) {
    await member.timeout(sanction.timeout, `Warn manuel : ${count} warns - ${reason}`)
      .then(() => {
        sanctionResult = `Timeout ${formatDurationMs(sanction.timeout)} appliqué`;
      })
      .catch(error => {
        sanctionResult = `Timeout impossible : ${error.message}`;
      });
  }

  return { sanction, sanctionResult, dmSent };
}

function formatWarningEntry(entry, index) {
  const date = entry.createdAt ? `<t:${Math.floor(entry.createdAt / 1000)}:f>` : 'Date inconnue';
  const moderator = entry.moderatorId ? ` • par <@${entry.moderatorId}>` : '';
  const reason = entry.reason || 'Aucune raison précisée';

  return `**${index}.** ${date}${moderator}\n${reason}`;
}

async function applyDiscordAdBan(message, violation) {
  const dmSent = await sendModerationDm(message.author, 'Ban automatique', [
    `Serveur : **${message.guild.name}**`,
    'Raison : **Pub serveur Discord**',
    '',
    'La publicité pour un serveur Discord est interdite.'
  ]);

  let banResult = 'Ban définitif appliqué';

  await message.member.ban({ reason: 'Auto-mod : pub serveur Discord' })
    .catch(error => {
      banResult = `Ban impossible : ${error.message}`;
    });

  await sendTemporaryChannelNotice(message.channel, violation.channelNotice);

  await sendAdminLog('🚫 Auto-modération - pub Discord', [
    `Membre : ${logUser(message.author)}`,
    `Salon : ${logChannel(message.channel)}`,
    `Action : **${banResult}**`,
    dmSent ? 'MP : envoyé' : 'MP : impossible à envoyer',
    '',
    `Message : \`${message.content.slice(0, 1000)}\``
  ], 0xE74C3C);
}

async function applyDmModerationNotice(message, violation) {
  const dmSent = await sendModerationDm(message.author, 'Message supprimé', [
    `Serveur : **${message.guild.name}**`,
    `Raison : **${violation.label}**`,
    '',
    'Les réseaux et liens personnels doivent se partager en MP si besoin.',
    'Aucun warn n’a été ajouté.'
  ]);

  await sendTemporaryChannelNotice(message.channel, violation.channelNotice);

  await sendAdminLog('📩 Auto-modération - rappel MP', [
    `Membre : ${logUser(message.author)}`,
    `Salon : ${logChannel(message.channel)}`,
    `Raison : **${violation.label}**`,
    'Warn : **non**',
    dmSent ? 'MP : envoyé' : 'MP : impossible à envoyer',
    '',
    `Message : \`${message.content.slice(0, 1000)}\``
  ], 0x3498DB);
}

async function handleAutoModeration(message) {
  if (!message.guild || !message.member || !message.content) return false;
  if (canBypassAutoModeration(message.member)) return false;

  const violation = inspectAutoModeration(message.content);
  if (!violation) return false;

  await message.delete().catch(() => {});

  if (violation.action === 'ban') {
    await applyDiscordAdBan(message, violation);
    return true;
  }

  if (violation.action === 'dm_notice') {
    await applyDmModerationNotice(message, violation);
    return true;
  }

  await applyWarningSanction(message, violation);
  return true;
}

function logUser(user) {
  return `${user} (${user.tag})`;
}

function logChannel(channel) {
  return `${channel} (${channel.id})`;
}

function formatRuntimeError(error) {
  if (!error) return 'Erreur inconnue';
  if (error.stack) return error.stack.slice(0, 1800);
  if (error.message) return error.message;
  return String(error).slice(0, 1800);
}

function crashFingerprint(title, error) {
  return `${title}:${error?.message || String(error)}`.slice(0, 500);
}

function shouldSendCrashReport(title, error) {
  const key = crashFingerprint(title, error);
  const now = Date.now();
  const lastSentAt = crashReportCooldowns.get(key) || 0;

  if (now - lastSentAt < CRASH_LOG_COOLDOWN) return false;

  crashReportCooldowns.set(key, now);
  return true;
}

async function reportCrash(title, error, context = []) {
  console.error(title, error);

  if (!client.isReady() || !shouldSendCrashReport(title, error)) return;

  await sendAdminLog(`🛡️ Anti-crash - ${title}`, [
    ...context,
    '',
    '```',
    formatRuntimeError(error),
    '```'
  ], 0xE74C3C).catch(() => {});
}

async function handleMessageError(message, error) {
  await reportCrash('Erreur messageCreate', error, [
    `Utilisateur : ${message?.author ? logUser(message.author) : 'Inconnu'}`,
    message?.channel ? `Salon : ${logChannel(message.channel)}` : 'Salon : inconnu',
    message?.content ? `Message : \`${message.content.slice(0, 500)}\`` : null
  ]);

  if (!message?.channel || typeof message.channel.send !== 'function') return;
  if (message.guild && !message.content?.startsWith('!')) return;

  const reply = await message.channel.send('⚠️ Une erreur est survenue, mais le bot reste en ligne.').catch(() => null);
  if (reply) deleteLater(reply, 5000);
}

async function handleInteractionError(interaction, error) {
  await reportCrash('Erreur interactionCreate', error, [
    `Utilisateur : ${interaction?.user ? logUser(interaction.user) : 'Inconnu'}`,
    interaction?.channel ? `Salon : ${logChannel(interaction.channel)}` : 'Salon : inconnu',
    interaction?.customId ? `Action : \`${interaction.customId}\`` : null,
    interaction?.commandName ? `Commande slash : \`${interaction.commandName}\`` : null
  ]);

  const payload = {
    content: '⚠️ Une erreur est survenue, mais le bot reste en ligne.',
    ephemeral: true
  };

  if (!interaction || typeof interaction.reply !== 'function') return;

  if (interaction.replied || interaction.deferred) {
    await interaction.followUp(payload).catch(() => {});
    return;
  }

  await interaction.reply(payload).catch(() => {});
}

function randomInviteColor() {
  const colors = [
    0xD4AF37,
    0x2ECC71,
    0x3498DB,
    0x9B59B6,
    0xE67E22,
    0xE91E63,
    0x1ABC9C
  ];

  return colors[Math.floor(Math.random() * colors.length)];
}

async function sendInviteJoinAnnouncement(member, referral) {
  const channel = client.channels.cache.get(INVITE_ANNOUNCE_CHANNEL_ID)
    || await client.channels.fetch(INVITE_ANNOUNCE_CHANNEL_ID).catch(() => null);

  if (!channel || typeof channel.send !== 'function') return;

  const description = referral
    ? [
        `👋 Bienvenue ${member} sur le serveur !`,
        '',
        `👥 Invité par : <@${referral.inviterId}>`
      ]
    : [
        `👋 Bienvenue ${member} sur le serveur !`,
        '',
        '👥 Invité par : **non détecté**',
        '',
        'Le bot n’a pas pu identifier l’invitation utilisée.'
      ];

  await channel.send({
    embeds: [
      new EmbedBuilder()
        .setColor(randomInviteColor())
        .setTitle('Nouvelle arrivée 🎉')
        .setDescription(description.join('\n'))
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: 'Invitations • Parrainage • Boutique' })
        .setTimestamp()
    ]
  }).catch(() => {});
}

async function sendInviteAdminAnnouncement(member, referral) {
  const channel = client.channels.cache.get(INVITE_ADMIN_CHANNEL_ID)
    || await client.channels.fetch(INVITE_ADMIN_CHANNEL_ID).catch(() => null);

  if (!channel || typeof channel.send !== 'function') return;

  const description = referral
    ? [
        `👤 Nouveau membre : ${member} (${member.user.tag})`,
        `👥 Invité par : <@${referral.inviterId}>`,
        '',
        'Statut : invitation enregistrée, récompense en attente de la première recharge.'
      ]
    : [
        `👤 Nouveau membre : ${member} (${member.user.tag})`,
        '',
        '👥 Invité par : non détecté'
      ];

  await channel.send({
    embeds: [
      new EmbedBuilder()
        .setColor(referral ? 0x3498DB : 0x95A5A6)
        .setTitle('Suivi invitation 👥')
        .setDescription(description.join('\n'))
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setTimestamp()
    ]
  }).catch(() => {});
}

client.once('ready', async () => {
  try {
    console.log('Bot connecte');
    normalizeReferralOwnersFromPersonalLinks();
    await Promise.all(client.guilds.cache.map(guild => cacheGuildInvites(guild)));
    scheduleTicketCleanups();
    sendBotLog('🟢 Bot connecté', `Connecté en tant que **${client.user.tag}**`, 0x2ECC71);
  } catch (error) {
    await reportCrash('Erreur au démarrage ready', error);
  }
});

client.on('error', error => {
  reportCrash('Erreur client Discord', error);
});

process.on('unhandledRejection', error => {
  reportCrash('Promesse rejetée non gérée', error);
});

process.on('uncaughtException', error => {
  reportCrash('Exception non capturée', error);
});

process.on('warning', warning => {
  reportCrash('Avertissement Node.js', warning);
});

client.on('warn', warning => {
  reportCrash('Avertissement Discord.js', warning);
});

client.on('shardError', error => {
  reportCrash('Erreur shard Discord', error);
});

client.on('shardDisconnect', (event, shardId) => {
  reportCrash('Shard déconnecté', new Error(`Shard ${shardId} déconnecté avec le code ${event?.code || 'inconnu'}`));
});

client.on('shardReconnecting', shardId => {
  reportCrash('Shard en reconnexion', new Error(`Shard ${shardId} tente une reconnexion.`));
});

client.on('shardResume', (shardId, replayedEvents) => {
  sendAdminLog('🟢 Shard reconnecté', [
    `Shard : **${shardId}**`,
    `Événements rejoués : **${replayedEvents || 0}**`
  ], 0x2ECC71);
});

client.on(Events.InviteCreate, invite => {
  if (invite.guild) cacheGuildInvites(invite.guild).catch(error => reportCrash('Erreur InviteCreate', error));
});

client.on(Events.InviteDelete, invite => {
  if (invite.guild) cacheGuildInvites(invite.guild).catch(error => reportCrash('Erreur InviteDelete', error));
});

client.on(Events.GuildMemberAdd, async member => {
  try {
    const referral = await recordMemberInvite(member);

    if (!referral) {
      await Promise.all([
        sendInviteJoinAnnouncement(member, null),
        sendInviteAdminAnnouncement(member, null)
      ]);
      return;
    }

    await Promise.all([
      sendInviteJoinAnnouncement(member, referral),
      sendInviteAdminAnnouncement(member, referral)
    ]);
  } catch (error) {
    await reportCrash('Erreur arrivée membre', error, [
      `Membre : ${member?.user ? logUser(member.user) : 'Inconnu'}`,
      `Serveur : ${member?.guild?.name || 'Inconnu'}`
    ]);
  }
});

client.on('messageCreate', async message => {
  if (message.author.bot) return;

  try {
  if (message.guild && await handleAutoModeration(message)) return;

  if (!message.guild) {
    const dmRequest = findOpenRechargeRequestByUser(message.author.id);

    if (!dmRequest) return;

    if (message.attachments.size === 0) {
      return message.channel.send('📸 Envoie ici le screenshot de ton paiement pour ta recharge en cours.');
    }

    const screenshotUrl = message.attachments.first()?.url || null;
    dmRequest.screenshotReceivedAt = Date.now();
    dmRequest.screenshotUrl = screenshotUrl;
    saveRequests();

    const adminChannel = await client.channels.fetch(dmRequest.channelId).catch(() => null);

    if (adminChannel) {
      await adminChannel.send([
        '✅ **Screenshot reçu !**',
        `💶 Montant : **${dmRequest.amount}** | Demande n°**${dmRequest.id}**`,
        `👤 Client : <@${dmRequest.userId}>`,
        `📅 Date indiquée : **${dmRequest.paymentDate || 'Non précisée'}**`,
        `🕒 Heure indiquée : **${dmRequest.paymentTime || 'Non précisée'}**`,
        screenshotUrl ? `📎 Screenshot : ${screenshotUrl}` : null,
        '',
        '⏳ Un administrateur va vérifier le paiement et créditer le solde.'
      ].filter(Boolean).join('\n'));
    }

    await sendAdminLog('📸 Screenshot recharge reçu', [
      `Client : ${logUser(message.author)}`,
      `Demande : **${dmRequest.id}**`,
      `Montant : **${dmRequest.amount}**`,
      `Date indiquée : **${dmRequest.paymentDate || 'Non précisée'}**`,
      `Heure indiquée : **${dmRequest.paymentTime || 'Non précisée'}**`,
      adminChannel ? `Ticket : ${logChannel(adminChannel)}` : 'Ticket : introuvable',
      screenshotUrl ? `Screenshot : ${screenshotUrl}` : null
    ], 0x2ECC71);

    return message.channel.send([
      '✅ **Screenshot reçu !**',
      `💶 Montant : **${dmRequest.amount}** | Demande n°**${dmRequest.id}**`,
      '',
      '⏳ Un administrateur va vérifier ton paiement et créditer ton solde.'
    ].join('\n'));
  }

  if (message.content.startsWith('!')) {
    await message.delete().catch(error => {
      console.error('Impossible de supprimer la commande :', error.message);
    });

    if (!isAdminMember(message.member)) {
      const reply = await message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(0xE74C3C)
            .setTitle('❌ Permission refusée')
            .setDescription('Tu n’as pas la permission d’utiliser cette commande.')
        ]
      });

      await sendActionLog(message.member, '⛔ Commande refusée', [
        `Utilisateur : ${logUser(message.author)}`,
        `Salon : ${logChannel(message.channel)}`,
        `Commande : \`${message.content.slice(0, 1000)}\``
      ], 0xE74C3C);

      return deleteLater(reply);
    }

    await sendAdminCommandLog('🛠️ Commande admin utilisée', [
      `Admin : ${logUser(message.author)}`,
      `Salon : ${logChannel(message.channel)}`,
      `Commande : \`${message.content.slice(0, 1000)}\``
    ], 0x95A5A6);
  }

  if (message.content === '!setup') {
    const embed = new EmbedBuilder()
      .setColor(0xD4AF37)
      .setAuthor({ name: 'Boutique', iconURL: message.guild.iconURL({ dynamic: true }) })
      .setTitle(`Boutique ${SHOP_EMOJI}`)
      .setDescription([
        '**Bienvenue sur la boutique.**',
        '',
        'Recharge ton portefeuille, choisis ton produit, puis le staff traite ta commande en ticket privé.',
        '',
        '**Comment commander**',
        '1. Clique sur **Portefeuille** pour vérifier ton solde.',
        '2. Clique sur **Recharger** si ton solde est insuffisant.',
        '3. Clique sur **Commander** et sélectionne ton produit.',
        '',
        '**Moyens de paiement**',
        '',
        'PayPal 🅿️ • Revolut 💳 • Virement bancaire 🏦',
        '',
        '**Tarifs**',
        productListText({ boldRanges: true })
      ].join('\n'))
      .setThumbnail(message.guild.iconURL({ dynamic: true }))
      .setFooter({ text: 'Portefeuille • Recharge • Commande • Support' });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('wallet').setLabel('Portefeuille').setEmoji('👛').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('recharger').setLabel('Recharger le solde').setEmoji('➕').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('commande').setLabel('Commander').setEmoji(MCDONALDS_BUTTON_EMOJI).setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('infos_points').setLabel('Fidélité Mcdo').setEmoji('🎁').setStyle(ButtonStyle.Secondary)
    );

    return message.channel.send({ embeds: [embed], components: [row] });
  }

  if (message.content === '!clear') {
    if (typeof message.channel.bulkDelete !== 'function') {
      const reply = await message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(0xE74C3C)
            .setTitle('❌ Salon incompatible')
            .setDescription('Cette commande ne peut être utilisée que dans un salon texte.')
        ]
      });

      return deleteLater(reply);
    }

    let deletedCount = 0;

    while (true) {
      const messages = await message.channel.messages.fetch({ limit: 100 }).catch(() => null);
      if (!messages || messages.size === 0) break;

      const deleted = await message.channel.bulkDelete(messages, true).catch(() => null);
      if (!deleted || deleted.size === 0) break;

      deletedCount += deleted.size;
      if (messages.size < 100) break;
    }

    await sendAdminLog('🧹 Salon nettoyé', [
      `Admin : ${logUser(message.author)}`,
      `Salon : ${logChannel(message.channel)}`,
      `Messages supprimés : **${deletedCount}**`
    ], 0xE67E22);

    const confirm = await message.channel.send(`✅ Salon nettoyé. **${deletedCount}** message(s) supprimé(s).`);
    setTimeout(() => confirm.delete().catch(() => {}), 5000);
    return;
  }

  if (message.content === '!support') {
    const supportEmbed = new EmbedBuilder()
      .setColor(0xD4AF37)
      .setTitle('🚨 Support')
      .setDescription([
        '📩 Besoin d’aide ?',
        'Tu peux ouvrir un ticket avec le staff si tu as :',
        '',
        '• une question sur une commande',
        '• un problème de recharge',
        '• un souci avec ton portefeuille',
        '• besoin d’aide pour utiliser la boutique',
        '',
        'Clique sur le bouton ci-dessous pour ouvrir un ticket.'
      ].join('\n'))
      .setFooter({ text: 'Support • Boutique McDonald\'s' });

    const supportRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('open_support_ticket')
        .setLabel('Ouvrir un ticket')
        .setEmoji('🚨')
        .setStyle(ButtonStyle.Primary)
    );

    return message.channel.send({ embeds: [supportEmbed], components: [supportRow] });
  }

  if (message.content === '!guide') {
    const guideEmbed = new EmbedBuilder()
      .setColor(0xD4AF37)
      .setAuthor({ name: 'Guide boutique', iconURL: message.guild.iconURL({ dynamic: true }) })
      .setTitle('Guide pour commander 📖')
      .setDescription([
        'Ce guide explique comment utiliser la boutique, même si tu débutes sur Discord. 👋',
        '',
        `Tout se passe dans le salon <#${SHOP_CHANNEL_ID}>.`,
        '',
        '**Recharger le solde 💳**',
        '',
        `1. Va dans <#${SHOP_CHANNEL_ID}>.`,
        '',
        '2. Clique sur **Recharger ➕**.',
        '',
        '3. Indique le montant, la date du paiement et l’heure si possible.',
        '',
        '4. Choisis ton moyen de paiement :',
        '',
        '• PayPal 🅿️',
        '',
        '• Revolut 💳',
        '',
        '• Virement bancaire 🏦',
        '',
        '5. Le bot t’envoie les instructions en message privé.',
        '',
        '6. Envoie ton screenshot de paiement au bot en message privé.',
        '',
        '7. Un administrateur vérifie puis crédite ton portefeuille.',
        '',
        `**Commander ${MCDONALDS_EMOJI}**`,
        '',
        `1. Va dans <#${SHOP_CHANNEL_ID}>.`,
        '',
        '2. Clique sur **Portefeuille 👛** pour vérifier ton solde.',
        '',
        `3. Clique sur **Commander ${MCDONALDS_EMOJI}**.`,
        '',
        '4. Choisis ton McDonald’s dans le menu.',
        '',
        '5. Si ton solde est suffisant, un ticket privé est créé pour ta commande.',
        '',
        '**Besoin d’aide ? 🆘**',
        '',
        `Ouvre un ticket support ici : <#${SUPPORT_CHANNEL_ID}>.`
      ].join('\n'))
      .setThumbnail(message.guild.iconURL({ dynamic: true }))
      .setFooter({ text: 'Guide • Recharge • Commande • Support' });

    return message.channel.send({ embeds: [guideEmbed] });
  }

  if (message.content === '!regles') {
    const rulesEmbed = new EmbedBuilder()
      .setColor(0xD4AF37)
      .setAuthor({ name: 'Règlement', iconURL: message.guild.iconURL({ dynamic: true }) })
      .setTitle('📜 Règlement du serveur')
      .setDescription([
        '👋 Bienvenue sur le serveur.',
        'Merci de lire et respecter les règles avant d’utiliser la boutique.',
        '',
        '🤝 **1. Respect**',
        'Reste poli avec les membres et le staff.',
        'Les insultes, provocations et comportements toxiques ne sont pas acceptés.',
        '',
        '🚫 **2. Publicité interdite**',
        'Toute publicité est interdite.',
        '**PUB INTERDIT SOUS PEINE DE BAN.**',
        '',
        '🔞 **3. Contenu NSFW interdit**',
        'Le contenu NSFW, choquant, violent ou inapproprié est interdit sur le serveur.',
        '',
        '🔁 **4. Spam**',
        'Le spam, les mentions abusives et les messages répétés sont interdits.',
        '',
        '🛒 **5. Boutique**',
        'Pour commander ou recharger ton solde, utilise uniquement le salon boutique prévu pour ça.',
        '',
        '💳 **6. Recharges**',
        'Indique les bonnes informations lors d’une recharge : montant, date du paiement et heure si possible.',
        'N’envoie jamais de fausse preuve de paiement.',
        '',
        '🎫 **7. Tickets**',
        'Ouvre un ticket seulement si tu as une vraie demande : support, commande, recharge ou problème de portefeuille.',
        '',
        '🔐 **8. Sécurité**',
        'Ne partage pas tes informations personnelles, tes identifiants ou tes moyens de paiement avec d’autres membres.',
        '',
        '**✅ Pour avoir accès à l’intégralité du serveur, veuillez accepter le règlement.**'
      ].join('\n'))
      .setThumbnail(message.guild.iconURL({ dynamic: true }))
      .setFooter({ text: 'Règlement • Accès serveur' });

    const rulesRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('accept_rules')
        .setLabel('Accepter le règlement')
        .setEmoji('✅')
        .setStyle(ButtonStyle.Success)
    );

    return message.channel.send({ embeds: [rulesEmbed], components: [rulesRow] });
  }

  if (message.content === '!tarifs') {
    const embed = new EmbedBuilder()
      .setColor(0xD4AF37)
      .setAuthor({ name: 'Boutique', iconURL: message.guild.iconURL({ dynamic: true }) })
      .setTitle(`Tarifs McDonald\'s ${MCDONALDS_EMOJI}`)
      .setDescription([
        '**Grille des tarifs disponibles.**',
        '',
        'Recharge ton solde puis utilise le bouton **Commander** sur le message boutique.',
        '',
        '**Tarifs**',
        '',
        '```',
        productListText(),
        '```'
      ].join('\n'))
      .setThumbnail(message.guild.iconURL({ dynamic: true }))
      .setFooter({ text: 'McDonald\'s • Solde obligatoire avant commande' });

    await message.channel.send({ embeds: [embed] });
    const confirm = await message.channel.send('✅ Tarifs envoyés.');
    setTimeout(() => confirm.delete().catch(() => {}), 2000);
    return;
  }

  if (message.content === '!mdp') {
    const paymentEmbed = new EmbedBuilder()
      .setColor(0xD4AF37)
      .setAuthor({ name: 'Boutique McDonald\'s', iconURL: message.guild.iconURL({ dynamic: true }) })
      .setTitle('Moyens de paiement 💳')
      .setDescription([
        '**Voici les moyens disponibles pour recharger ton solde.**',
        '',
        'Pour recharger, rends-toi dans le salon boutique :',
        `<#${SHOP_CHANNEL_ID}>`,
        '',
        '**❗❗ Ne mets aucune note lors du paiement. ❗❗**',
        '',
        'Les informations de paiement ne sont pas affichées ici.',
        '',
        'Clique sur **Recharger** pour recevoir les détails en message privé.',
        '',
        'Après le paiement, envoie ton screenshot au bot en message privé.'
      ].join('\n'))
      .addFields(
        {
          name: 'PayPal 🅿️',
          value: 'Disponible via **Recharger**.',
          inline: false
        },
        {
          name: 'Revolut 💳',
          value: 'Disponible via **Recharger**.',
          inline: false
        },
        {
          name: 'Virement bancaire 🏦',
          value: 'Disponible via **Recharger**.',
          inline: false
        }
      )
      .setThumbnail(message.guild.iconURL({ dynamic: true }))
      .setFooter({ text: 'Paiement • Recharge • Solde boutique' });

    await message.channel.send({ embeds: [paymentEmbed] });
    const confirm = await message.channel.send('✅ Moyens de paiement envoyés.');
    setTimeout(() => confirm.delete().catch(() => {}), 2000);
    return;
  }

  if (message.content === '!parrainage') {
    const referralEmbed = new EmbedBuilder()
      .setColor(0xD4AF37)
      .setAuthor({ name: 'Parrainage', iconURL: message.guild.iconURL({ dynamic: true }) })
      .setTitle('Parrainage 📨')
      .setDescription([
        'Invite tes amis avec ton lien personnel et gagne du solde boutique. 👥',
        '',
        '**Récompenses 🎁**',
        '',
        '1 filleul validé = **+1€** 💰',
        '',
        '5 filleuls validés = **+5€** ⭐',
        '',
        '10 filleuls validés = **+7€** 🏆',
        '',
        '**Validation ✅**',
        '',
        'Un filleul est validé uniquement après sa première recharge de solde. 💳',
        '',
        'Clique sur le bouton ci-dessous pour afficher ton lien personnel. 🔗'
      ].join('\n'))
      .setThumbnail(message.guild.iconURL({ dynamic: true }))
      .setFooter({ text: 'Parrainage • Invitations • Récompenses' });

    const referralRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('get_referral_invite')
        .setLabel('Obtenir mon lien')
        .setEmoji('🔗')
        .setStyle(ButtonStyle.Primary)
    );

    return message.channel.send({ embeds: [referralEmbed], components: [referralRow] });
  }

  if (message.content === '!avis') {
    return message.channel.send({ embeds: [buildAvisEmbed()] });
  }

  if (message.content.startsWith('!warnings')) {
    const user = message.mentions.users.first();

    if (!user) {
      const reply = await message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(0xE74C3C)
            .setTitle('❌ Commande invalide')
            .setDescription('Utilisation : `!warnings @membre`')
        ]
      });

      return deleteLater(reply);
    }

    const userWarnings = ensureWarningUser(user.id);
    const entries = userWarnings.entries || [];
    const recentWarnings = entries.length
      ? entries
          .slice(-10)
          .reverse()
          .map((entry, index) => formatWarningEntry(entry, entries.length - index))
          .join('\n\n')
      : 'Aucun warn enregistré.';

    await sendAdminLog('⚠️ Warns consultés', [
      `Admin : ${logUser(message.author)}`,
      `Membre : ${logUser(user)}`,
      `Warns : **${entries.length}/5**`,
      `Salon : ${logChannel(message.channel)}`
    ], 0x3498DB);

    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(entries.length ? 0xE67E22 : 0x2ECC71)
          .setTitle('⚠️ Warns')
          .setDescription([
            `Membre : ${user}`,
            `Total : **${entries.length}/5**`,
            '',
            '**Derniers warns**',
            recentWarnings
          ].join('\n'))
          .setThumbnail(user.displayAvatarURL({ dynamic: true }))
      ]
    });
  }

  if (message.content.startsWith('!unwarn')) {
    const user = message.mentions.users.first();
    const args = message.content.trim().split(/\s+/);
    const amount = Math.max(1, Number.parseInt(args[2] || '1', 10) || 1);

    if (!user) {
      const reply = await message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(0xE74C3C)
            .setTitle('❌ Commande invalide')
            .setDescription('Utilisation : `!unwarn @membre [nombre]`')
        ]
      });

      return deleteLater(reply);
    }

    const userWarnings = ensureWarningUser(user.id);

    if (userWarnings.entries.length === 0) {
      const reply = await message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(0xE67E22)
            .setTitle('⚠️ Aucun warn')
            .setDescription(`${user} n’a aucun warn enregistré.`)
        ]
      });

      return deleteLater(reply);
    }

    const removed = removeLatestWarnings(user.id, amount);
    const remaining = ensureWarningUser(user.id).entries.length;

    await sendAdminLog('✅ Warn retiré', [
      `Admin : ${logUser(message.author)}`,
      `Membre : ${logUser(user)}`,
      `Warns retirés : **${removed.length}**`,
      `Warns restants : **${remaining}/5**`,
      `Salon : ${logChannel(message.channel)}`
    ], 0x2ECC71);

    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0x2ECC71)
          .setTitle('✅ Warn retiré')
          .setDescription([
            `Membre : ${user}`,
            `Warns retirés : **${removed.length}**`,
            `Warns restants : **${remaining}/5**`
          ].join('\n'))
      ]
    });
  }

  if (message.content.startsWith('!clearwarns')) {
    const user = message.mentions.users.first();

    if (!user) {
      const reply = await message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(0xE74C3C)
            .setTitle('❌ Commande invalide')
            .setDescription('Utilisation : `!clearwarns @membre`')
        ]
      });

      return deleteLater(reply);
    }

    const removedCount = clearUserWarnings(user.id);

    await sendAdminLog('🧹 Warns supprimés', [
      `Admin : ${logUser(message.author)}`,
      `Membre : ${logUser(user)}`,
      `Warns supprimés : **${removedCount}**`,
      `Salon : ${logChannel(message.channel)}`
    ], 0x2ECC71);

    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0x2ECC71)
          .setTitle('🧹 Warns supprimés')
          .setDescription([
            `Membre : ${user}`,
            `Warns supprimés : **${removedCount}**`
          ].join('\n'))
      ]
    });
  }

  if (message.content.startsWith('!warn')) {
    const user = message.mentions.users.first();
    const args = message.content.trim().split(/\s+/);
    const reason = args.slice(2).join(' ').trim() || 'Aucune raison précisée';
    const member = user ? await message.guild.members.fetch(user.id).catch(() => null) : null;

    if (!user || !member) {
      const reply = await message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(0xE74C3C)
            .setTitle('❌ Commande invalide')
            .setDescription('Utilisation : `!warn @membre raison`')
        ]
      });

      return deleteLater(reply);
    }

    if (user.bot || canBypassAutoModeration(member)) {
      const reply = await message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(0xE67E22)
            .setTitle('⚠️ Membre protégé')
            .setDescription('Tu ne peux pas warn ce membre avec cette commande.')
        ]
      });

      return deleteLater(reply);
    }

    const { userWarnings } = addManualWarning(user.id, {
      reason,
      moderatorId: message.author.id,
      channelId: message.channel.id,
      guildId: message.guild.id
    });

    const count = userWarnings.count;
    const { sanction, sanctionResult, dmSent } = await applyManualWarningSanction(
      message.guild,
      member,
      user,
      count,
      reason,
      message.author
    );

    await sendAdminLog('⚠️ Warn manuel', [
      `Admin : ${logUser(message.author)}`,
      `Membre : ${logUser(user)}`,
      `Raison : **${reason}**`,
      `Warns : **${count}/5**`,
      `Sanction : **${sanctionResult}**`,
      dmSent ? 'MP : envoyé' : 'MP : impossible à envoyer',
      `Salon : ${logChannel(message.channel)}`
    ], sanction.ban ? 0xE74C3C : 0xE67E22);

    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(sanction.ban ? 0xE74C3C : 0xE67E22)
          .setTitle('⚠️ Warn ajouté')
          .setDescription([
            `Membre : ${user}`,
            `Raison : **${reason}**`,
            `Warns : **${count}/5**`,
            `Sanction : **${sanctionResult}**`,
            dmSent ? 'MP : envoyé' : 'MP : impossible à envoyer'
          ].join('\n'))
      ]
    });
  }

  if (message.content.startsWith('!wallet')) {
    const user = message.mentions.users.first();

    if (!user) {
      const reply = await message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(0xE74C3C)
            .setTitle('❌ Commande invalide')
            .setDescription('Utilisation : `!wallet @membre`')
        ]
      });

      return deleteLater(reply);
    }

    if (!wallets[user.id]) {
      wallets[user.id] = { balance: 0 };
      saveWallets();
    }

    await sendAdminLog('👛 Portefeuille consulté', [
      `Admin : ${logUser(message.author)}`,
      `Membre : ${logUser(user)}`,
      `Solde : **${wallets[user.id].balance.toFixed(2)}€**`,
      `Salon : ${logChannel(message.channel)}`
    ], 0x3498DB);

    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0x3498DB)
          .setTitle('👛 Portefeuille')
          .setDescription([
            `👤 Membre : ${user}`,
            `💰 Solde : **${wallets[user.id].balance.toFixed(2)}€**`
          ].join('\n'))
          .setThumbnail(user.displayAvatarURL({ dynamic: true }))
      ]
    });
  }

  if (message.content.startsWith('!invites')) {
    const user = message.mentions.users.first();

    if (!user) {
      const reply = await message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(0xE74C3C)
            .setTitle('❌ Commande invalide')
            .setDescription('Utilisation : `!invites @membre`')
        ]
      });

      return deleteLater(reply);
    }

    const summary = getReferralSummary(user.id);
    const invitedBy = referrals.invitedBy[user.id] || null;
    const recentValidated = summary.validated
      .slice(-10)
      .map(referral => `✅ <@${referral.invitedUserId}>`)
      .join('\n') || 'Aucun filleul validé.';
    const recentPending = summary.pending
      .slice(-10)
      .map(referral => `⏳ <@${referral.invitedUserId}>`)
      .join('\n') || 'Aucun filleul en attente.';

    const invitedByText = invitedBy
      ? [
          `Parrain : <@${invitedBy.inviterId}>`,
          `Statut : **${invitedBy.validated ? 'Validé' : 'En attente de première recharge'}**`,
          `Arrivée : ${formatReferralDate(invitedBy.joinedAt)}`
        ].join('\n')
      : 'Aucun parrain détecté pour ce membre.';

    await sendAdminLog('👥 Parrainage consulté', [
      `Admin : ${logUser(message.author)}`,
      `Membre : ${logUser(user)}`,
      `Validés : **${summary.validated.length}**`,
      `En attente : **${summary.pending.length}**`
    ], 0x3498DB);

    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0x3498DB)
          .setTitle('👥 Statistiques parrainage')
          .setDescription([
            `👤 Membre : ${user}`,
            '',
            `✅ Filleuls validés : **${summary.validated.length}**`,
            `⏳ Filleuls en attente : **${summary.pending.length}**`,
            '',
            '**Invité par**',
            invitedByText
          ].join('\n'))
          .addFields(
            { name: 'Derniers filleuls validés', value: recentValidated, inline: false },
            { name: 'Filleuls en attente', value: recentPending, inline: false }
          )
          .setThumbnail(user.displayAvatarURL({ dynamic: true }))
          .setFooter({ text: 'Parrainage • Invitations • Boutique' })
      ]
    });
  }

  if (message.content === '!topinvites') {
    const leaderboard = buildReferralLeaderboard();

    if (leaderboard.length === 0) {
      return message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(0xE67E22)
            .setTitle('🏆 Top parrainage')
            .setDescription('Aucune invitation enregistrée pour le moment.')
        ]
      });
    }

    const medal = ['🥇', '🥈', '🥉'];
    const lines = leaderboard.map((row, index) => [
      `${medal[index] || `**${index + 1}.**`} <@${row.inviterId}>`,
      `✅ Validés : **${row.validated}** • ⏳ En attente : **${row.pending}**`
    ].join('\n'));

    await sendAdminLog('🏆 Top parrainage consulté', [
      `Admin : ${logUser(message.author)}`,
      `Salon : ${logChannel(message.channel)}`
    ], 0x3498DB);

    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0xD4AF37)
          .setTitle('🏆 Top parrainage')
          .setDescription(lines.join('\n\n'))
          .setFooter({ text: 'Classement par filleuls validés' })
      ]
    });
  }

  if (message.content.trim().split(/\s+/)[0] === '!add') {
    const ticketRequest = getTicketRequest(message.channel.id);
    const mentionedUser = message.mentions.users.first();
    const userId = mentionedUser ? mentionedUser.id : ticketRequest?.userId;
    const user = userId ? await client.users.fetch(userId).catch(() => null) : null;
    const args = message.content.split(' ');
    const amount = parseFloat(mentionedUser ? args[2] : args[1]);

    if (!user || !Number.isFinite(amount)) {
      const reply = await message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(0xE74C3C)
            .setTitle('❌ Commande invalide')
            .setDescription('Utilisation : `!add @user montant` ou `!add montant` dans un ticket recharge.')
        ]
      });

      return deleteLater(reply);
    }

    if (!wallets[user.id]) wallets[user.id] = { balance: 0 };
    wallets[user.id].balance += amount;
    saveWallets();

    if (ticketRequest && ticketRequest.type === 'recharge' && ticketRequest.userId === user.id) {
      const amountText = `${amount.toFixed(2)}€`;
      const newBalanceText = `${wallets[user.id].balance.toFixed(2)}€`;
      const methodName = paymentLabel(ticketRequest.method);

      const dmEmbed = new EmbedBuilder()
        .setColor(0x2ECC71)
        .setTitle('✅ Recharge validée')
        .setDescription([
          'Ta recharge a été validée avec succès.',
          '',
          `🧾 Demande : n°${ticketRequest.id}`,
          `💰 Montant ajouté : **${amountText}**`,
          `👤 Pris en charge par : **${message.author.tag}**`,
          '',
          'Ton solde est maintenant disponible sur la boutique.'
        ].join('\n'));

      let dmSent = false;
      await user.send({ embeds: [dmEmbed] })
        .then(() => { dmSent = true; })
        .catch(async () => {
          const warn = await message.channel.send('⚠️ Impossible d’envoyer un MP au client. Le ticket reste ouvert.');
          deleteLater(warn);
        });

      await message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(0x2ECC71)
            .setTitle(`✅ Paiement ${methodName} validé !`)
            .setDescription([
              `💶 Montant crédité : **${amountText}**`,
              `💰 Nouveau solde : **${newBalanceText}**`,
              `🆔 Demande : **n°${ticketRequest.id}**`,
              dmSent ? '📩 MP envoyé au client.' : '⚠️ MP non envoyé au client.'
            ].join('\n'))
        ]
      });

      await sendAdminLog('✅ Recharge validée', [
        `Admin : ${logUser(message.author)}`,
        `Client : ${logUser(user)}`,
        `Demande : **${ticketRequest.id}**`,
        `Méthode : **${methodName}**`,
        `Montant ajouté : **${amountText}**`,
        `Nouveau solde : **${newBalanceText}**`,
        `Ticket : ${logChannel(message.channel)}`,
        dmSent ? 'MP client : envoyé' : 'MP client : non envoyé'
      ], dmSent ? 0x2ECC71 : 0xF1C40F);

      const referralReward = await validateReferralReward(user, ticketRequest, amountText);
      if (referralReward) {
        await message.channel.send({
          embeds: [
            new EmbedBuilder()
              .setColor(0x2ECC71)
              .setTitle('🎁 Parrainage validé')
              .setDescription([
                `👤 Parrain : ${referralReward.inviter}`,
                `💰 Récompense ajoutée : **${referralReward.totalReward.toFixed(2)}€**`,
                `👥 Filleuls validés : **${referralReward.stats.validated}**`,
                `👛 Nouveau solde parrain : **${referralReward.newBalanceText}**`
              ].join('\n'))
          ]
        });
      }

      if (dmSent) {
        await message.channel.send('✅ Le ticket sera déplacé dans les tickets supprimés dans 10 secondes.');
        setTimeout(() => {
          archiveTicketChannel(message.channel, ticketRequest, message.author, ticketRequest.userId)
            .then(() => {
              sendAdminLog('📁 Ticket recharge archivé', [
                `Admin : ${logUser(message.author)}`,
                `Ticket : ${logChannel(message.channel)}`,
                `Demande : **${ticketRequest.id}**`,
                `Client : <@${ticketRequest.userId}>`
              ], 0xE67E22);
            })
            .catch(error => {
              sendAdminLog('⚠️ Archivage ticket impossible', [
                `Admin : ${logUser(message.author)}`,
                `Ticket : ${logChannel(message.channel)}`,
                `Demande : **${ticketRequest.id}**`,
                `Erreur : \`${error.message}\``
              ], 0xE74C3C);
            });
        }, 10_000);
      }

      return;
    }

    await sendAdminLog('💰 Solde ajouté', [
      `Admin : ${logUser(message.author)}`,
      `Membre : ${logUser(user)}`,
      `Montant ajouté : **${amount.toFixed(2)}€**`,
      `Nouveau solde : **${wallets[user.id].balance.toFixed(2)}€**`,
      `Salon : ${logChannel(message.channel)}`
    ], 0x2ECC71);

    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0x2ECC71)
          .setTitle('✅ Solde ajouté')
          .setDescription(`**${amount}€** ont été ajoutés au portefeuille de ${user}.`)
      ]
    });
  }

  if (message.content.trim().split(/\s+/)[0] === '!remove') {
    const args = message.content.split(' ');
    const user = message.mentions.users.first();
    const amount = parseFloat(args[2]);

    if (!user || !Number.isFinite(amount)) {
      const reply = await message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(0xE74C3C)
            .setTitle('❌ Commande invalide')
            .setDescription('Utilisation : `!remove @user montant`')
        ]
      });

      return deleteLater(reply);
    }

    if (!wallets[user.id]) wallets[user.id] = { balance: 0 };
    wallets[user.id].balance -= amount;
    saveWallets();

    await sendAdminLog('💸 Solde retiré', [
      `Admin : ${logUser(message.author)}`,
      `Membre : ${logUser(user)}`,
      `Montant retiré : **${amount.toFixed(2)}€**`,
      `Nouveau solde : **${wallets[user.id].balance.toFixed(2)}€**`,
      `Salon : ${logChannel(message.channel)}`
    ], 0xE67E22);

    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0xE67E22)
          .setTitle('✅ Solde retiré')
          .setDescription(`**${amount}€** ont été retirés du portefeuille de ${user}.`)
      ]
    });
  }
  } catch (error) {
    await handleMessageError(message, error);
  }
});

client.on(Events.InteractionCreate, async interaction => {
  try {
  if (interaction.isButton()) {
    if (interaction.customId === 'get_referral_invite') {
      const invite = await getOrCreatePersonalInvite(interaction.guild, interaction.user).catch(async error => {
        console.error('Impossible de créer le lien de parrainage :', error.message);
        await interaction.reply({
          content: '❌ Impossible de créer ton lien pour le moment. Contacte un administrateur.',
          ephemeral: true
        });
        return null;
      });

      if (!invite) return;

      const stats = getReferralSummary(interaction.user.id);
      const inviteEmbed = new EmbedBuilder()
        .setColor(0xD4AF37)
        .setTitle('Ton lien de parrainage 🔗')
        .setDescription([
          'Partage ce lien avec tes amis pour les inviter sur le serveur.',
          '',
          invite.url,
          '',
          '**Récompenses**',
          '1 filleul validé = **+1€**',
          '5 filleuls validés = **+5€**',
          '10 filleuls validés = **+7€**',
          '',
          `✅ Filleuls validés : **${stats.validated.length}**`,
          `⏳ Filleuls en attente : **${stats.pending.length}**`
        ].join('\n'))
        .setFooter({ text: 'Un filleul est validé après sa première recharge.' });

      sendActionLog(interaction.member, '🎟️ Lien parrainage demandé', [
        `Membre : ${logUser(interaction.user)}`,
        `Lien : ${invite.url}`,
        `Affichage : message éphémère dans ${logChannel(interaction.channel)}`
      ], 0x2ECC71);

      return interaction.reply({
        embeds: [inviteEmbed],
        ephemeral: true
      });
    }

    if (interaction.customId === 'accept_rules') {
      const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);

      if (!member) {
        return interaction.reply({
          content: '❌ Impossible de trouver ton profil sur le serveur.',
          ephemeral: true
        });
      }

      if (member.roles.cache.has(RULES_ROLE_ID)) {
        return interaction.reply({
          content: '✅ Tu as déjà accepté le règlement.',
          ephemeral: true
        });
      }

      await member.roles.add(RULES_ROLE_ID).catch(async () => {
        await interaction.reply({
          content: '❌ Impossible de te donner le rôle. Contacte un administrateur.',
          ephemeral: true
        });
      });

      if (interaction.replied) return;

      sendActionLog(member, '✅ Règlement accepté', [
        `Membre : ${logUser(interaction.user)}`,
        `Rôle donné : <@&${RULES_ROLE_ID}>`
      ], 0x2ECC71);

      return interaction.reply({
        content: '✅ Règlement accepté, tu as maintenant accès au serveur.',
        ephemeral: true
      });
    }

    if (interaction.customId.startsWith('complete_order:')) {
      const ownerId = interaction.customId.split(':')[1];
      const ticketRequest = getTicketRequest(interaction.channel.id);

      if (!canCompleteOrderTicket(interaction.member)) {
        return interaction.reply({
          content: '❌ Tu ne peux pas terminer cette commande.',
          ephemeral: true
        });
      }

      if (!ticketRequest || ticketRequest.type !== 'commande') {
        return interaction.reply({
          content: '❌ Ce bouton ne peut être utilisé que dans un ticket commande.',
          ephemeral: true
        });
      }

      if (ticketRequest.completedAt) {
        return interaction.reply({
          content: '✅ Cette commande est déjà marquée comme terminée.',
          ephemeral: true
        });
      }

      await interaction.deferReply({ ephemeral: true });

      try {
        await interaction.message.edit({ components: [ticketButtons(ownerId)] }).catch(() => {});
        await completeOrderTicketChannel(interaction.channel, ticketRequest, interaction.user, ownerId);
      } catch (error) {
        await interaction.editReply(`❌ Impossible de terminer la commande : ${error.message}`);
        return;
      }

      await sendAdminLog('✅ Commande terminée', [
        `Par : ${logUser(interaction.user)}`,
        `Ticket : ${logChannel(interaction.channel)}`,
        `Demande : **${ticketRequest.id}**`,
        `Client : <@${ticketRequest.userId}>`,
        `Produit : **${ticketRequest.product || 'Non précisé'}**`,
        `Catégorie : <#${ORDER_DONE_CATEGORY}>`
      ], 0x2ECC71);

      await interaction.editReply('✅ Commande terminée, ticket déplacé et message d’avis envoyé.');
      return;
    }

    if (interaction.customId.startsWith('delete_ticket:')) {
      const ownerId = interaction.customId.split(':')[1];
      const ticketRequest = getTicketRequest(interaction.channel.id);
      const archived = isTicketArchived(interaction.channel, ticketRequest);

      if (archived ? !isAdminMember(interaction.member) : !canManageTicket(interaction, ownerId)) {
        return interaction.reply({ content: '❌ Tu ne peux pas supprimer ce ticket.', ephemeral: true });
      }

      const confirmRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`confirm_delete_ticket:${ownerId}`)
          .setLabel(archived ? 'Supprimer définitivement' : 'Confirmer')
          .setEmoji('✅')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('cancel_delete_ticket').setLabel('Annuler').setEmoji('❌').setStyle(ButtonStyle.Secondary)
      );

      return interaction.reply({
        content: archived
          ? '⚠️ Confirmer la suppression définitive de ce ticket ?'
          : '⚠️ Confirmer la suppression de ce ticket ? Il sera déplacé dans les tickets supprimés.',
        components: [confirmRow],
        ephemeral: true
      });
    }

    if (interaction.customId.startsWith('confirm_delete_ticket:')) {
      const ownerId = interaction.customId.split(':')[1];
      const ticketRequest = getTicketRequest(interaction.channel.id);
      const archived = isTicketArchived(interaction.channel, ticketRequest);

      if (archived ? !isAdminMember(interaction.member) : !canManageTicket(interaction, ownerId)) {
        return interaction.reply({ content: '❌ Tu ne peux pas supprimer ce ticket.', ephemeral: true });
      }

      if (archived) {
        clearArchivedTicketCleanup(interaction.channel.id);

        sendAdminLog('🗑️ Ticket supprimé définitivement', [
          `Par : ${logUser(interaction.user)}`,
          `Ticket : ${logChannel(interaction.channel)}`,
          ticketRequest ? `Demande : **${ticketRequest.id}**` : 'Demande : inconnue',
          ticketRequest ? `Type : **${ticketRequest.type}**` : null,
          ticketRequest ? `Client : <@${ticketRequest.userId}>` : null
        ], 0xE74C3C);

        delete requests.tickets[interaction.channel.id];
        saveRequests();
        await interaction.reply({ content: '🗑️ Ticket supprimé définitivement dans 5 secondes...', ephemeral: true });
        setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
        return;
      }

      try {
        await interaction.update({ content: '📁 Ticket déplacé dans les tickets supprimés.', components: [] });
        await archiveTicketChannel(interaction.channel, ticketRequest, interaction.user, ownerId);
      } catch (error) {
        const errorReply = {
          content: `❌ Impossible de déplacer le ticket : ${error.message}`,
          ephemeral: true
        };

        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(errorReply).catch(() => {});
        } else {
          await interaction.reply(errorReply).catch(() => {});
        }

        return;
      }

      sendAdminLog('📁 Ticket déplacé dans les tickets supprimés', [
        `Par : ${logUser(interaction.user)}`,
        `Ticket : ${logChannel(interaction.channel)}`,
        ticketRequest ? `Demande : **${ticketRequest.id}**` : 'Demande : inconnue',
        ticketRequest ? `Type : **${ticketRequest.type}**` : null,
        ticketRequest ? `Client : <@${ticketRequest.userId}>` : null
      ], 0xE67E22);
      return;
    }

    if (interaction.customId === 'cancel_delete_ticket') {
      return interaction.update({ content: '✅ Suppression annulée.', components: [] });
    }

    if (interaction.customId.startsWith('reopen_ticket:')) {
      const ownerId = interaction.customId.split(':')[1];
      if (!isAdminMember(interaction.member)) {
        return interaction.reply({ content: '❌ Tu ne peux pas réouvrir ce ticket.', ephemeral: true });
      }

      const ticketRequest = getTicketRequest(interaction.channel.id);

      if (!ticketRequest) {
        return interaction.reply({
          content: '❌ Impossible de retrouver les informations de ce ticket.',
          ephemeral: true
        });
      }

      try {
        await interaction.update({ content: '🔓 Ticket réouvert.', embeds: [], components: [] });
        await reopenTicketChannel(interaction.channel, ticketRequest, interaction.user, ownerId);
      } catch (error) {
        const errorReply = {
          content: `❌ Impossible de réouvrir le ticket : ${error.message}`,
          ephemeral: true
        };

        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(errorReply).catch(() => {});
        } else {
          await interaction.reply(errorReply).catch(() => {});
        }

        return;
      }

      sendAdminLog('🔓 Ticket réouvert', [
        `Par : ${logUser(interaction.user)}`,
        `Ticket : ${logChannel(interaction.channel)}`,
        `Demande : **${ticketRequest.id}**`,
        `Type : **${ticketRequest.type}**`,
        `Client : <@${ticketRequest.userId}>`
      ], 0x2ECC71);

      return;
    }

    if (interaction.customId === 'open_support_ticket') {
      const ticket = await interaction.guild.channels.create({
        name: `support-${sanitizeChannelName(interaction.user.username)}`,
        parent: SUPPORT_CATEGORY,
        type: ChannelType.GuildText,
        permissionOverwrites: supportTicketPermissionOverwrites(interaction.guild, interaction.user.id)
      });

      const request = createRequest('support', ticket.id, interaction.user.id);
      await ticket.send({
        content: `🚨 Ticket support

🧾 Demande : #${request.id}
👤 Client : <@${interaction.user.id}>

📩 Explique ton problème ici.
👥 Un administrateur va te répondre dès que possible.`,
        components: [ticketButtons(interaction.user.id)]
      });

      sendAdminLog('🚨 Ticket support créé', [
        `Client : ${logUser(interaction.user)}`,
        `Demande : **${request.id}**`,
        `Ticket : ${logChannel(ticket)}`
      ], 0xF1C40F);

      return replyTemp(interaction, {
        content: `✅ Ticket support créé : ${ticket}\n🧾 Demande : #${request.id}`,
        ephemeral: true
      });
    }

    if (interaction.customId === 'wallet') {
      if (!wallets[interaction.user.id]) wallets[interaction.user.id] = { balance: 0 };
      sendActionLog(interaction.member, '👛 Portefeuille consulté', [
        `Membre : ${logUser(interaction.user)}`,
        `Solde : **${wallets[interaction.user.id].balance.toFixed(2)}€**`,
        `Salon : ${logChannel(interaction.channel)}`
      ], 0x3498DB);

      return replyTemp(interaction, {
        content: `💳 Solde actuel : ${wallets[interaction.user.id].balance.toFixed(2)}€`,
        ephemeral: true
      });
    }

    if (interaction.customId === 'infos_points') {
      const infoEmbed = new EmbedBuilder()
        .setColor(0xD4AF37)
        .setTitle('Programme de Fidélité Mcdo');
      if (INFO_IMAGE) infoEmbed.setImage(INFO_IMAGE);
      sendActionLog(interaction.member, '🎁 Fidélité Mcdo consultée', [
        `Membre : ${logUser(interaction.user)}`,
        `Salon : ${logChannel(interaction.channel)}`
      ], 0x3498DB);

      return replyTemp(interaction, { embeds: [infoEmbed], ephemeral: true }, 30_000);
    }

    if (interaction.customId === 'recharger') {
      sendActionLog(interaction.member, '➕ Recharge ouverte', [
        `Membre : ${logUser(interaction.user)}`,
        `Salon : ${logChannel(interaction.channel)}`
      ], 0x3498DB);

      const modal = new ModalBuilder().setCustomId('recharge_amount').setTitle('Recharge de solde');
      const amountInput = new TextInputBuilder()
        .setCustomId('amount')
        .setLabel('Montant entre 1€ et 200€')
        .setPlaceholder('Exemple : 10')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMinLength(1)
        .setMaxLength(6);
      const dateInput = new TextInputBuilder()
        .setCustomId('payment_date')
        .setLabel('Date du paiement/virement')
        .setPlaceholder('Exemple : 30/04/2026')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMinLength(4)
        .setMaxLength(30);
      const timeInput = new TextInputBuilder()
        .setCustomId('payment_time')
        .setLabel('Heure approximative (si possible)')
        .setPlaceholder('Exemple : 14h30')
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
        .setMaxLength(20);

      modal.addComponents(
        new ActionRowBuilder().addComponents(amountInput),
        new ActionRowBuilder().addComponents(dateInput),
        new ActionRowBuilder().addComponents(timeInput)
      );
      return interaction.showModal(modal);
    }

    if (interaction.customId === 'commande') {
      sendActionLog(interaction.member, '🎫 Fenêtre commande ouverte', [
        `Membre : ${logUser(interaction.user)}`,
        `Salon : ${logChannel(interaction.channel)}`
      ], 0x3498DB);

      const orderEmbed = new EmbedBuilder()
        .setColor(0xD4AF37)
        .setTitle(`${MCDONALDS_EMOJI} Fenêtre de commande`)
        .setDescription(['Choisis ton produit dans le menu ci-dessous.', '', '```', productListText(), '```'].join('\n'))
        .setFooter({ text: 'Cette fenêtre disparaît automatiquement.' });

      const menu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('produits')
          .setPlaceholder('🛒 Choisir un produit...')
          .addOptions(products.map(product => ({
            label: product.label,
            description: product.description,
            value: product.value,
            emoji: '💰'
          })))
      );

      return replyTemp(interaction, { embeds: [orderEmbed], components: [menu], ephemeral: true });
    }
  }

  if (interaction.isModalSubmit() && interaction.customId === 'recharge_amount') {
    const cents = parseAmountToCents(interaction.fields.getTextInputValue('amount'));
    const paymentDate = interaction.fields.getTextInputValue('payment_date').trim();
    const paymentTime = interaction.fields.getTextInputValue('payment_time').trim() || 'Non précisée';

    if (cents === null) {
      return replyTemp(interaction, {
        content: '❌ Montant invalide. Entrez un montant entre 1€ et 200€.',
        ephemeral: true
      });
    }

    if (!paymentDate) {
      return replyTemp(interaction, {
        content: '❌ Date invalide. Indique la date du paiement ou du virement.',
        ephemeral: true
      });
    }

    const rechargeKey = pendingRechargeKey(interaction);
    pendingRecharges.set(rechargeKey, { paymentDate, paymentTime });
    setTimeout(() => pendingRecharges.delete(rechargeKey), 15 * 60_000);

    sendActionLog(interaction.member, '🧾 Recharge renseignée', [
      `Membre : ${logUser(interaction.user)}`,
      `Montant : **${formatAmount(cents)}**`,
      `Date indiquée : **${paymentDate}**`,
      `Heure indiquée : **${paymentTime}**`
    ], 0x3498DB);

    const paymentMenu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`payment_method:${cents}`)
        .setPlaceholder('💳 Choisir un moyen de paiement...')
        .addOptions([
          { label: 'PayPal', description: `Recharge de ${formatAmount(cents)}`, value: 'paypal', emoji: '🅿️' },
          { label: 'Revolut', description: `Recharge de ${formatAmount(cents)}`, value: 'revolut', emoji: '💳' },
          { label: 'Virement bancaire', description: `Recharge de ${formatAmount(cents)}`, value: 'virement', emoji: '🏦' }
        ])
    );

    return replyTemp(interaction, {
      content: [
        `💰 Montant choisi : ${formatAmount(cents)}`,
        `📅 Date indiquée : ${paymentDate}`,
        `🕒 Heure indiquée : ${paymentTime}`,
        '',
        'Choisissez un moyen de paiement :'
      ].join('\n'),
      components: [paymentMenu],
      ephemeral: true
    });
  }

  if (interaction.isStringSelectMenu()) {
    if (interaction.customId.startsWith('payment_method:')) {
      const cents = Number(interaction.customId.split(':')[1]);
      const method = interaction.values[0];
      const amount = formatAmount(cents);
      const pendingRecharge = pendingRecharges.get(pendingRechargeKey(interaction));

      if (!pendingRecharge) {
        return replyTemp(interaction, {
          content: '❌ Les détails de recharge ont expiré. Relance une recharge.',
          ephemeral: true
        });
      }

      pendingRecharges.delete(pendingRechargeKey(interaction));

      const ticket = await interaction.guild.channels.create({
        name: `recharge-${sanitizeChannelName(interaction.user.username)}`,
        parent: TICKET_CATEGORY,
        type: ChannelType.GuildText,
        permissionOverwrites: adminTicketPermissionOverwrites(interaction.guild)
      });

      const request = createRequest('recharge', ticket.id, interaction.user.id, {
        amount,
        method,
        paymentDate: pendingRecharge.paymentDate,
        paymentTime: pendingRecharge.paymentTime
      });
      const methodName = paymentLabel(method);
      let dmSent = false;

      await interaction.user.send(rechargeInstructionMessage(request))
        .then(() => {
          dmSent = true;
        })
        .catch(() => {});

      await ticket.send({
        content: `<@&${STAFF_ROLE_ID}>

🧾 **Nouvelle demande de recharge ${methodName}**

Demande n°**${request.id}**
👤 Client : <@${interaction.user.id}>
💶 Montant déclaré : **${amount}**
💳 Moyen de paiement : **${methodName}**
📅 Date indiquée : **${request.paymentDate}**
🕒 Heure indiquée : **${request.paymentTime}**

${dmSent ? '📩 Instructions envoyées au client en MP.' : '⚠️ Impossible d’envoyer les instructions en MP au client.'}
⏳ En attente du screenshot du paiement.`,
        components: [ticketButtons(interaction.user.id)]
      });

      sendAdminLog('💳 Demande de recharge créée', [
        `Client : ${logUser(interaction.user)}`,
        `Demande : **${request.id}**`,
        `Montant : **${amount}**`,
        `Méthode : **${methodName}**`,
        `Date indiquée : **${request.paymentDate}**`,
        `Heure indiquée : **${request.paymentTime}**`,
        `Ticket : ${logChannel(ticket)}`,
        dmSent ? 'MP instructions : envoyé' : 'MP instructions : non envoyé'
      ], dmSent ? 0x2ECC71 : 0xF1C40F);

      return replyTemp(interaction, {
        content: dmSent
          ? `✅ Demande de recharge créée pour ${amount}.\n📩 Les instructions ont été envoyées en MP.\n🧾 Demande : #${request.id}`
          : `⚠️ Demande créée, mais impossible de t’envoyer un MP. Contacte le staff.\n🧾 Demande : #${request.id}`,
        ephemeral: true
      });
    }

    if (interaction.customId !== 'produits') return;

    const uid = interaction.user.id;
    if (!wallets[uid]) wallets[uid] = { balance: 0 };

    const productId = interaction.values[0];
    const product = products.find(item => item.value === productId);
    const prix = prices[productId];

    if (!product || prix === undefined) {
      return replyTemp(interaction, { content: '❌ Produit introuvable.', ephemeral: true });
    }

    if (wallets[uid].balance < prix) {
      sendActionLog(interaction.member, '⚠️ Commande refusée - solde insuffisant', [
        `Client : ${logUser(interaction.user)}`,
        `Produit : **${product.label}**`,
        `Prix : **${prix}€**`,
        `Solde : **${wallets[uid].balance.toFixed(2)}€**`
      ], 0xF1C40F);

      return replyTemp(interaction, {
        content: `❌ Solde insuffisant\n💰 Prix : ${prix}€\n👛 Solde : ${wallets[uid].balance.toFixed(2)}€`,
        ephemeral: true
      });
    }

    wallets[uid].balance -= prix;
    saveWallets();

    const ticket = await interaction.guild.channels.create({
      name: `commande-${sanitizeChannelName(interaction.user.username)}`,
      parent: ORDER_CATEGORY,
      type: ChannelType.GuildText,
      permissionOverwrites: ticketPermissionOverwrites(interaction.guild, interaction.user.id)
    });

    const request = createRequest('commande', ticket.id, interaction.user.id, {
      product: product.label,
      price: prix
    });

    await ticket.send({
      content: `<@&${STAFF_ROLE_ID}>

🎫 Nouvelle commande à traiter

🧾 Demande : #${request.id}
👤 Client : <@${interaction.user.id}>
📦 Produit : ${product.label}
💰 Payé : ${prix}€

📌 Envoyer le produit au client.`,
      components: [orderTicketButtons(interaction.user.id)]
    });

    sendAdminLog('🎫 Commande créée', [
      `Client : ${logUser(interaction.user)}`,
      `Demande : **${request.id}**`,
      `Produit : **${product.label}**`,
      `Prix payé : **${prix}€**`,
      `Nouveau solde : **${wallets[uid].balance.toFixed(2)}€**`,
      `Ticket : ${logChannel(ticket)}`
    ], 0x2ECC71);

    return replyTemp(interaction, {
      content: `✅ Commande envoyée au staff.\n🧾 Demande : #${request.id}`,
      ephemeral: true
    });
  }
  } catch (error) {
    await handleInteractionError(interaction, error);
  }
});

client.login(process.env.DISCORD_TOKEN).catch(error => {
  reportCrash('Connexion Discord impossible', error, [
    'Vérifie que `DISCORD_TOKEN` est bien configuré.'
  ]);
});
