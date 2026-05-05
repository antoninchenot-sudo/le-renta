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

const ADMIN_ROLE_ID = '1310342652058800138';
const STAFF_ROLE_ID = '1310342652058800138';
const TICKET_ACCESS_ROLE_ID = '1310384527952056401';
const REFERRAL_EXCLUDED_ROLE_IDS = [...new Set([ADMIN_ROLE_ID, STAFF_ROLE_ID, TICKET_ACCESS_ROLE_ID])];
const TICKET_CATEGORY = '1495800617204187216';
const ORDER_CATEGORY = '1495800432776446063';
const ORDER_DONE_CATEGORY = '1499779941934436403';
const SUPPORT_CATEGORY = '1499036733986308146';
const TICKET_ARCHIVE_CATEGORY = '1499765419399970908';
const SHOP_CHANNEL_ID = '1310381741218988122';
const SUPPORT_CHANNEL_ID = '1498434089450078258';
const LOG_CHANNEL_ID = '1310354201704136747';
const ADMIN_COMMAND_LOG_CHANNEL_ID = '1499758004797702225';
const ADMIN_CHANGELOG_CHANNEL_ID = '1500475167313231983';
const AVAILABILITY_CHANNEL_ID = '1310355422993186896';
const AVIS_CHANNEL_ID = '1497652398259306516';
const INVITE_ANNOUNCE_CHANNEL_ID = '1310355769824383059';
const INVITE_ADMIN_CHANNEL_ID = '1499523428112142568';
const RULES_ROLE_ID = '1310359454377840650';
const CUSTOMER_ROLE_ID = '1499537426463461586';
const DELETE_DELAY = 10_000;
const ARCHIVED_TICKET_TTL = 24 * 60 * 60 * 1000;
const TICKET_NO_RESPONSE_REMINDER_DELAY = 60 * 60 * 1000;
const TICKET_NO_RESPONSE_TTL = 4 * 60 * 60 * 1000;
const WALLET_CONFIRMATION_TTL = 5 * 60 * 1000;

const SHOP_EMOJI = '🛒';
const MCDONALDS_EMOJI_ID = '1498440076257136830';
const MCDONALDS_EMOJI_NAME = '4964mcdonalds';
const MCDONALDS_EMOJI = `<:${MCDONALDS_EMOJI_NAME}:${MCDONALDS_EMOJI_ID}>`;
const MCDONALDS_BUTTON_EMOJI = { id: MCDONALDS_EMOJI_ID, name: MCDONALDS_EMOJI_NAME };
const INFO_IMAGE = process.env.INFO_IMAGE || 'https://i0.wp.com/direct-actu.fr/wp-content/uploads/2024/11/1725353427343-ad6c22b5-478a-412e-9c6f-8e14646acd5e_1.png?ssl=1';
const PAYPAL_LINK = 'https://www.paypal.me/LaRenta23';
const REVOLUT_LINK = 'https://revolut.me/arthur23320/pocket/vNrIna0VcG';
const IBAN = 'FR76 2823 3000 0165 8385 8232 516';
const DEFAULT_PAYMENT_CONFIG = {
  paypal: PAYPAL_LINK,
  revolut: REVOLUT_LINK,
  iban: IBAN,
  updatedAt: null,
  updatedBy: null
};
const NO_NOTE_TEXT = '❗❗ Ne mettre aucune note lors du paiement ❗❗';
const WALLET_FILE = 'wallets.json';
const WALLET_HISTORY_FILE = 'wallet-history.json';
const WALLET_HISTORY_LIMIT = 50;
const TICKET_HISTORY_FILE = 'ticket-history.json';
const TICKET_HISTORY_LIMIT = 50;
const WALLET_BACKUP_DIR = path.join('backups', 'wallets');
const WALLET_BACKUP_LIMIT = 50;
const DATA_BACKUP_DIR = path.join('backups', 'data');
const DATA_BACKUP_LIMIT = 50;
const DATA_BACKUP_DEBOUNCE_DELAY = 1_500;
const REQUESTS_FILE = 'requests.json';
const REFERRALS_FILE = 'referrals.json';
const MAINTENANCE_FILE = 'maintenance-state.json';
const SHOP_STATS_FILE = 'shop-stats.json';
const WARNINGS_FILE = 'warnings.json';
const BOT_CHANGELOG_FILE = 'bot-changelog-state.json';
const AVAILABILITY_STATE_FILE = 'availability-message-state.json';
const PRODUCT_PRICES_FILE = 'product-prices.json';
const DISCOUNT_STATE_FILE = 'discount-state.json';
const PRODUCT_STOCK_FILE = 'product-stock.json';
const PAYMENT_CONFIG_FILE = 'payment-config.json';
const DATA_BACKUP_FILES = [
  WALLET_FILE,
  WALLET_HISTORY_FILE,
  TICKET_HISTORY_FILE,
  REQUESTS_FILE,
  REFERRALS_FILE,
  MAINTENANCE_FILE,
  SHOP_STATS_FILE,
  WARNINGS_FILE,
  AVAILABILITY_STATE_FILE,
  PRODUCT_PRICES_FILE,
  DISCOUNT_STATE_FILE,
  PRODUCT_STOCK_FILE,
  PAYMENT_CONFIG_FILE
];
const BOT_CHANGELOG_VERSION = '2026-05-05-payment-config-discord';
// Garder uniquement les changements de cette version, pas l’historique complet du bot.
const BOT_CHANGELOG_ITEMS = [
  'Ajout de !paiements pour modifier PayPal, Revolut et IBAN depuis Discord.'
];
const AVAILABILITY_TIMEZONE = 'Europe/Paris';
const AVAILABILITY_CHECK_INTERVAL = 60_000;
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

function backupReasonSlug(reason) {
  return String(reason || 'manuel')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'manuel';
}

function createDataBackup(reason = 'manuel', actorUser = null) {
  try {
    ensureDirectory(DATA_BACKUP_DIR);

    const files = {};
    for (const fileName of DATA_BACKUP_FILES) {
      if (!fs.existsSync(fileName)) {
        files[fileName] = { exists: false };
        continue;
      }

      try {
        files[fileName] = {
          exists: true,
          data: JSON.parse(fs.readFileSync(fileName, 'utf8'))
        };
      } catch (error) {
        files[fileName] = {
          exists: true,
          error: error.message
        };
      }
    }

    const backupPath = path.join(DATA_BACKUP_DIR, `data-${backupReasonSlug(reason)}-${backupTimestamp()}.json`);
    const snapshot = {
      version: 1,
      reason,
      createdAt: Date.now(),
      createdAtIso: new Date().toISOString(),
      actorId: actorUser?.id || null,
      actorTag: actorUser?.tag || null,
      files
    };

    fs.writeFileSync(backupPath, JSON.stringify(snapshot, null, 2));
    cleanupBackups(DATA_BACKUP_DIR, DATA_BACKUP_LIMIT);

    return {
      filePath: backupPath,
      fileCount: Object.values(files).filter(file => file.exists).length
    };
  } catch (error) {
    console.error('Impossible de créer la sauvegarde globale des données.', error);
    reportCrash('Sauvegarde globale impossible', error, [
      `Raison : \`${reason}\``
    ]);
    return null;
  }
}

const pendingDataBackupReasons = new Set();
let pendingDataBackupActor = null;
let pendingDataBackupTimer = null;

function scheduleDataBackup(reason, actorUser = null) {
  pendingDataBackupReasons.add(reason || 'auto');
  if (actorUser) pendingDataBackupActor = actorUser;
  if (pendingDataBackupTimer) return;

  pendingDataBackupTimer = setTimeout(() => {
    const reasons = [...pendingDataBackupReasons];
    const actor = pendingDataBackupActor;
    pendingDataBackupReasons.clear();
    pendingDataBackupActor = null;
    pendingDataBackupTimer = null;
    createDataBackup(reasons.length === 1 ? reasons[0] : `batch_${reasons.length}_actions`, actor);
  }, DATA_BACKUP_DEBOUNCE_DELAY);

  pendingDataBackupTimer.unref?.();
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
let walletHistory = loadJsonFile(WALLET_HISTORY_FILE, { users: {} });
let ticketHistory = loadJsonFile(TICKET_HISTORY_FILE, { users: {} });
let requests = loadJsonFile(REQUESTS_FILE, { counter: 0, tickets: {} });
let referrals = loadJsonFile(REFERRALS_FILE, { invitedBy: {}, stats: {}, inviteLinks: {} });
let maintenanceState = loadJsonFile(MAINTENANCE_FILE, { enabled: false, updatedAt: null, updatedBy: null });
let shopStats = loadJsonFile(SHOP_STATS_FILE, {
  totalRechargedCents: 0,
  totalRemovedCents: 0,
  rechargeValidatedCount: 0,
  ordersCreated: 0,
  ordersCompleted: 0,
  products: {}
});
let warnings = loadJsonFile(WARNINGS_FILE, { users: {} });
let botChangelogState = loadJsonFile(BOT_CHANGELOG_FILE, { announcedVersions: {} });
let availabilityState = loadJsonFile(AVAILABILITY_STATE_FILE, {
  enabled: true,
  lastMessageId: null,
  lastSlot: null,
  sentDates: {}
});
let productPriceOverrides = loadJsonFile(PRODUCT_PRICES_FILE, {});
let discountState = loadJsonFile(DISCOUNT_STATE_FILE, { percent: 0, updatedAt: null, updatedBy: null });
let productStockState = loadJsonFile(PRODUCT_STOCK_FILE, { unavailable: {}, updatedAt: null, updatedBy: null });
let paymentConfig = loadJsonFile(PAYMENT_CONFIG_FILE, { ...DEFAULT_PAYMENT_CONFIG });

if (fs.existsSync(WALLET_FILE)) {
  try {
    backupJsonSnapshot(WALLET_FILE, WALLET_BACKUP_DIR);
  } catch (error) {
    console.error('Impossible de créer la sauvegarde initiale du portefeuille.', error);
  }
}

if (!referrals.inviteLinks) referrals.inviteLinks = {};
if (!walletHistory.users) walletHistory.users = {};
if (!ticketHistory.users) ticketHistory.users = {};
if (typeof maintenanceState.enabled !== 'boolean') maintenanceState.enabled = false;
if (!shopStats.products) shopStats.products = {};
if (!warnings.users) warnings.users = {};
if (!botChangelogState.announcedVersions) botChangelogState.announcedVersions = {};
if (typeof availabilityState.enabled !== 'boolean') availabilityState.enabled = true;
if (!availabilityState.sentDates) availabilityState.sentDates = {};
if (!productPriceOverrides || typeof productPriceOverrides !== 'object' || Array.isArray(productPriceOverrides)) {
  productPriceOverrides = {};
}
if (!discountState || typeof discountState !== 'object' || Array.isArray(discountState)) {
  discountState = { percent: 0, updatedAt: null, updatedBy: null };
}
discountState.percent = Number(discountState.percent) || 0;
if (discountState.percent < 0) discountState.percent = 0;
if (!productStockState || typeof productStockState !== 'object' || Array.isArray(productStockState)) {
  productStockState = { unavailable: {}, updatedAt: null, updatedBy: null };
}
if (!productStockState.unavailable || typeof productStockState.unavailable !== 'object' || Array.isArray(productStockState.unavailable)) {
  productStockState.unavailable = {};
}
if (!paymentConfig || typeof paymentConfig !== 'object' || Array.isArray(paymentConfig)) {
  paymentConfig = { ...DEFAULT_PAYMENT_CONFIG };
}
for (const key of ['paypal', 'revolut', 'iban']) {
  if (!String(paymentConfig[key] || '').trim()) paymentConfig[key] = DEFAULT_PAYMENT_CONFIG[key];
}
paymentConfig.updatedAt = paymentConfig.updatedAt || null;
paymentConfig.updatedBy = paymentConfig.updatedBy || null;

const pendingRecharges = new Map();
const pendingWalletActions = new Map();
const pendingRefundActions = new Map();
const interactionActionLocks = new Map();
const guildInviteUses = new Map();
const crashReportCooldowns = new Map();
const ticketCleanupTimers = new Map();
const ticketNoResponseReminderTimers = new Map();
let availabilitySchedulerTimer = null;
const CRASH_LOG_COOLDOWN = 60_000;

function saveWallets() {
  saveJsonFile(WALLET_FILE, wallets, { backupDir: WALLET_BACKUP_DIR });
}

function saveWalletHistory() {
  saveJsonFile(WALLET_HISTORY_FILE, walletHistory);
}

function saveTicketHistory() {
  saveJsonFile(TICKET_HISTORY_FILE, ticketHistory);
}

function saveRequests() {
  saveJsonFile(REQUESTS_FILE, requests);
}

function saveReferrals() {
  saveJsonFile(REFERRALS_FILE, referrals);
}

function saveShopStats() {
  saveJsonFile(SHOP_STATS_FILE, shopStats);
}

function saveMaintenanceState() {
  saveJsonFile(MAINTENANCE_FILE, maintenanceState);
}

function saveWarnings() {
  saveJsonFile(WARNINGS_FILE, warnings);
}

function saveBotChangelogState() {
  saveJsonFile(BOT_CHANGELOG_FILE, botChangelogState);
}

function saveAvailabilityState() {
  saveJsonFile(AVAILABILITY_STATE_FILE, availabilityState);
}

function saveProductPrices() {
  saveJsonFile(PRODUCT_PRICES_FILE, productPriceOverrides);
}

function saveDiscountState() {
  saveJsonFile(DISCOUNT_STATE_FILE, discountState);
}

function saveProductStock() {
  saveJsonFile(PRODUCT_STOCK_FILE, productStockState);
}

function savePaymentConfig() {
  saveJsonFile(PAYMENT_CONFIG_FILE, paymentConfig);
}

function acquireInteractionActionLock(key) {
  if (!key) return true;
  if (interactionActionLocks.has(key)) return false;

  const timeout = setTimeout(() => {
    interactionActionLocks.delete(key);
  }, 30_000);
  timeout.unref?.();
  interactionActionLocks.set(key, timeout);
  return true;
}

function releaseInteractionActionLock(key) {
  if (!key) return;
  const timeout = interactionActionLocks.get(key);
  if (timeout) clearTimeout(timeout);
  interactionActionLocks.delete(key);
}

function interactionActionLockKey(interaction) {
  if (!interaction?.isButton?.()) return null;

  const customId = interaction.customId || '';
  const channelId = interaction.channel?.id || interaction.channelId;
  if (!channelId) return null;

  const ticketActions = [
    'complete_order:',
    'take_ticket:',
    'confirm_delete_ticket:',
    'accept_recharge_proof:',
    'reject_recharge_proof:'
  ];

  if (ticketActions.some(prefix => customId.startsWith(prefix))) {
    return `ticket-action:${channelId}`;
  }

  if (customId.startsWith('confirm_wallet_action:') || customId.startsWith('cancel_wallet_action:')) {
    return `wallet-action:${customId.split(':')[1] || channelId}`;
  }

  if (customId.startsWith('confirm_refund_action:') || customId.startsWith('cancel_refund_action:')) {
    return `refund-action:${customId.split(':')[1] || channelId}`;
  }

  return null;
}

function isAdminMember(member) {
  return Boolean(
    member?.roles?.cache?.has(ADMIN_ROLE_ID) ||
    member?.permissions?.has?.(PermissionFlagsBits.Administrator)
  );
}

function isOwnerMember(member) {
  return Boolean(member?.roles?.cache?.has(ADMIN_ROLE_ID));
}

function createRequest(type, channelId, userId, data = {}) {
  requests.counter += 1;
  const prefix = type === 'recharge' ? 'R' : type === 'support' ? 'S' : 'C';
  const createdAt = Date.now();
  const request = {
    id: `${prefix}-${String(requests.counter).padStart(4, '0')}`,
    type,
    channelId,
    userId,
    createdAt,
    noResponseReminderAt: createdAt + TICKET_NO_RESPONSE_REMINDER_DELAY,
    noResponseCloseAt: createdAt + TICKET_NO_RESPONSE_TTL,
    ...data
  };

  requests.tickets[channelId] = request;
  saveRequests();
  upsertTicketHistory(request);
  scheduleOpenTicketNoResponseReminder(channelId, request.noResponseReminderAt);
  scheduleOpenTicketNoResponseCleanup(channelId, request.noResponseCloseAt);
  return request;
}

function getTicketRequest(channelId) {
  return requests.tickets[channelId] || null;
}

function hasTicketMemberResponse(ticketRequest) {
  return Boolean(
    ticketRequest?.firstMemberResponseAt ||
    ticketRequest?.lastMemberResponseAt ||
    (ticketRequest?.firstResponseBy && ticketRequest.firstResponseBy === ticketRequest.userId) ||
    (ticketRequest?.lastResponseBy && ticketRequest.lastResponseBy === ticketRequest.userId)
  );
}

function shouldTrackNoMemberResponse(ticketRequest) {
  return Boolean(
    ticketRequest &&
    !ticketRequest.archivedAt &&
    !ticketRequest.completedAt &&
    !ticketRequest.screenshotReceivedAt &&
    !hasTicketMemberResponse(ticketRequest)
  );
}

function ensureNoMemberResponseCloseAt(ticketRequest) {
  if (!shouldTrackNoMemberResponse(ticketRequest)) return false;
  let changed = false;

  const createdAt = Number(ticketRequest.createdAt);
  const openedAt = Number.isFinite(createdAt) && createdAt > 0 ? createdAt : Date.now();
  const targetReminderAt = openedAt + TICKET_NO_RESPONSE_REMINDER_DELAY;
  const targetCloseAt = openedAt + TICKET_NO_RESPONSE_TTL;

  if (!ticketRequest.noResponseReminderSentAt && Number(ticketRequest.noResponseReminderAt) !== targetReminderAt) {
    ticketRequest.noResponseReminderAt = targetReminderAt;
    changed = true;
  }

  if (Number(ticketRequest.noResponseCloseAt) !== targetCloseAt) {
    ticketRequest.noResponseCloseAt = targetCloseAt;
    changed = true;
  }

  return changed;
}

function markTicketResponse(ticketRequest, userId) {
  if (!ticketRequest || ticketRequest.archivedAt || ticketRequest.completedAt) return;
  if (userId !== ticketRequest.userId) return;

  const now = Date.now();
  if (!ticketRequest.firstMemberResponseAt) ticketRequest.firstMemberResponseAt = now;
  ticketRequest.lastMemberResponseAt = now;
  if (!ticketRequest.firstResponseAt) ticketRequest.firstResponseAt = now;
  if (!ticketRequest.firstResponseBy) ticketRequest.firstResponseBy = userId;
  ticketRequest.lastResponseAt = now;
  ticketRequest.lastResponseBy = userId;
  delete ticketRequest.noResponseReminderAt;
  delete ticketRequest.noResponseCloseAt;
  clearTicketNoResponseReminder(ticketRequest.channelId);
  clearTicketCleanup(ticketRequest.channelId);
  saveRequests();
}

function isActiveTicketRequest(ticketRequest) {
  return Boolean(ticketRequest && !ticketRequest.archivedAt && !ticketRequest.completedAt);
}

async function findActiveTicketByUser(userId, type = null) {
  for (const [channelId, ticketRequest] of Object.entries(requests.tickets || {})) {
    if (ticketRequest?.userId !== userId || !isActiveTicketRequest(ticketRequest)) continue;
    if (type && ticketRequest.type !== type) continue;

    const channel = client.channels.cache.get(channelId)
      || await client.channels.fetch(channelId).catch(() => null);

    if (channel) return { channel, ticketRequest };

    upsertTicketHistory(ticketRequest, {
      deletedAt: Date.now(),
      deletedReason: 'Salon introuvable'
    });
    delete requests.tickets[channelId];
    clearTicketCleanup(channelId);
    saveRequests();
  }

  return null;
}

async function confirmOpeningAnotherTicket(interaction, type) {
  const activeTicket = await findActiveTicketByUser(interaction.user.id, type);
  if (!activeTicket) return { confirmed: true, interaction };

  const typeLabels = {
    recharge: 'recharge',
    support: 'support',
    commande: 'commande'
  };
  const typeLabel = typeLabels[activeTicket.ticketRequest.type] || 'ticket';
  const isRecharge = activeTicket.ticketRequest.type === 'recharge';

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('confirm_open_another_ticket')
      .setLabel('Oui, ouvrir un autre')
      .setEmoji('✅')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId('cancel_open_another_ticket')
      .setLabel('Non')
      .setEmoji('❌')
      .setStyle(ButtonStyle.Secondary)
  );

  const prompt = await interaction.reply({
    content: isRecharge
      ? [
          '⚠️ Vous avez déjà une recharge en cours.',
          'Le bot vous a envoyé les instructions en message privé.',
          '',
          'Êtes-vous sûr de vouloir ouvrir une autre demande ?'
        ].join('\n')
      : [
          `⚠️ Vous avez déjà un ticket ${typeLabel} ouvert : ${activeTicket.channel}`,
          '',
          'Êtes-vous sûr de vouloir en ouvrir un autre ?'
        ].join('\n'),
    components: [row],
    ephemeral: true,
    fetchReply: true
  });

  try {
    const confirmation = await prompt.awaitMessageComponent({
      filter: componentInteraction => (
        componentInteraction.user.id === interaction.user.id &&
        ['confirm_open_another_ticket', 'cancel_open_another_ticket'].includes(componentInteraction.customId)
      ),
      time: 30_000
    });

    if (confirmation.customId === 'cancel_open_another_ticket') {
      await confirmation.update({
        content: isRecharge
          ? [
              '📩 Va dans tes messages privés avec le bot.',
              'Les instructions de ta recharge en cours y sont envoyées.'
            ].join('\n')
          : `Voici ton ticket déjà ouvert : ${activeTicket.channel}`,
        components: []
      });

      return { confirmed: false };
    }

    await confirmation.update({
      content: '✅ D’accord, création du nouveau ticket en cours...',
      components: []
    });

    return { confirmed: true, interaction: confirmation };
  } catch {
    await interaction.editReply({
      content: '⏱️ Ouverture du nouveau ticket annulée.',
      components: []
    }).catch(() => {});

    return { confirmed: false };
  }
}

function findOpenRechargeRequestByUser(userId) {
  return Object.values(requests.tickets)
    .reverse()
    .find(request => request.type === 'recharge' && request.userId === userId && !request.paidAt) || null;
}

function pendingRechargeKey(interaction) {
  return `${interaction.guildId}:${interaction.user.id}`;
}

function parseWalletAmount(value) {
  return Number.parseFloat(String(value || '').replace(',', '.'));
}

function parseProductPriceInput(value) {
  const normalized = String(value || '').trim().replace(',', '.');
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return NaN;
  return Number.parseFloat(normalized);
}

function parseDiscountPercent(value) {
  const normalized = String(value || '')
    .trim()
    .replace(',', '.')
    .replace(/%/g, '')
    .replace(/^\+/, '');
  if (!/^-?\d+(?:\.\d{1,2})?$/.test(normalized)) return NaN;
  return Math.abs(Number.parseFloat(normalized));
}

function formatWalletAmount(amount) {
  return `${amount.toFixed(2)}€`;
}

function eurosToCents(amount) {
  return Math.round((Number(amount) || 0) * 100);
}

function formatCents(cents) {
  return `${((Number(cents) || 0) / 100).toFixed(2)}€`;
}

function isMaintenanceEnabledFor(member) {
  return Boolean(maintenanceState.enabled && !isOwnerMember(member));
}

function maintenanceNotice() {
  const updatedBy = maintenanceState.updatedBy ? `<@${maintenanceState.updatedBy}>` : 'un owner';
  const enabledAt = maintenanceState.updatedAt ? `<t:${Math.floor(maintenanceState.updatedAt / 1000)}:R>` : 'récemment';
  return [
    '🛠️ **Boutique en maintenance**',
    '',
    `La boutique a été mise en maintenance par ${updatedBy} ${enabledAt}.`,
    maintenanceState.reason ? `Raison : **${maintenanceState.reason}**` : null,
    'Les commandes et recharges sont temporairement bloquées.',
    'Le support reste ouvert si besoin.'
  ].filter(Boolean).join('\n');
}

function setMaintenanceState(enabled, user, reason = '') {
  maintenanceState.enabled = enabled;
  maintenanceState.updatedAt = Date.now();
  maintenanceState.updatedBy = user.id;
  maintenanceState.reason = reason || null;
  saveMaintenanceState();
  scheduleDataBackup(enabled ? 'maintenance_on' : 'maintenance_off', user);
}

async function replyMaintenance(interaction) {
  return replyTemp(interaction, {
    content: maintenanceNotice(),
    ephemeral: true
  });
}

function ensureWalletHistory(userId) {
  if (!walletHistory.users[userId]) walletHistory.users[userId] = [];
  if (!Array.isArray(walletHistory.users[userId])) walletHistory.users[userId] = [];
  return walletHistory.users[userId];
}

function recordWalletHistory(userId, entry) {
  if (!userId) return;

  const entries = ensureWalletHistory(userId);
  entries.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: entry.type,
    amountCents: Number(entry.amountCents) || 0,
    balanceAfterCents: Number(entry.balanceAfterCents) || 0,
    actorId: entry.actorId || null,
    ticketRequestId: entry.ticketRequestId || null,
    product: entry.product || null,
    note: entry.note || null,
    createdAt: Date.now()
  });

  walletHistory.users[userId] = entries.slice(0, WALLET_HISTORY_LIMIT);
  saveWalletHistory();
}

function walletHistoryTypeLabel(type) {
  const labels = {
    recharge: 'Recharge validée',
    add: 'Ajout manuel',
    remove: 'Retrait manuel',
    order: 'Commande payée',
    refund: 'Remboursement commande',
    referral: 'Récompense parrainage'
  };

  return labels[type] || 'Action portefeuille';
}

function formatWalletHistoryLine(entry, index) {
  const date = entry.createdAt ? `<t:${Math.floor(entry.createdAt / 1000)}:f>` : 'Date inconnue';
  const amountPrefix = entry.amountCents >= 0 ? '+' : '-';
  const amountText = `${amountPrefix}${formatCents(Math.abs(entry.amountCents))}`;
  const actor = entry.actorId ? ` • par <@${entry.actorId}>` : '';
  const request = entry.ticketRequestId ? ` • ${entry.ticketRequestId}` : '';
  const product = entry.product ? ` • ${entry.product}` : '';
  const note = entry.note ? `\n${entry.note}` : '';

  return [
    `**${index + 1}.** ${date}${actor}`,
    `${walletHistoryTypeLabel(entry.type)}${request}${product}`,
    `Montant : **${amountText}** • Solde après : **${formatCents(entry.balanceAfterCents)}**${note}`
  ].join('\n');
}

function buildWalletHistoryEmbed(user) {
  const entries = ensureWalletHistory(user.id).slice(0, 10);
  const balance = Number(wallets[user.id]?.balance) || 0;
  const description = entries.length
    ? entries.map(formatWalletHistoryLine).join('\n\n')
    : 'Aucune action enregistrée pour ce membre depuis l’activation de l’historique.';

  return new EmbedBuilder()
    .setColor(0x3498DB)
    .setTitle('👛 Historique portefeuille')
    .setDescription(description)
    .addFields({
      name: 'Solde actuel',
      value: `Membre : ${user}\nSolde : **${formatWalletAmount(balance)}**`,
      inline: false
    })
    .setThumbnail(user.displayAvatarURL({ dynamic: true }))
    .setTimestamp();
}

function ensureTicketHistory(userId) {
  if (!ticketHistory.users[userId]) ticketHistory.users[userId] = [];
  if (!Array.isArray(ticketHistory.users[userId])) ticketHistory.users[userId] = [];
  return ticketHistory.users[userId];
}

function ticketTypeLabel(type) {
  const labels = {
    commande: 'Commande',
    recharge: 'Recharge',
    support: 'Support'
  };

  return labels[type] || 'Ticket';
}

function ticketStatusLabel(ticketRequest) {
  if (ticketRequest?.deletedAt && ticketRequest?.refundedAt) return 'Supprimé (remboursé)';
  if (ticketRequest?.deletedAt) return 'Supprimé';
  if (ticketRequest?.refundedAt) return 'Remboursé';
  if (ticketRequest?.completedAt) return 'Terminé';
  if (ticketRequest?.type === 'recharge' && ticketRequest?.paidAt) return 'Recharge validée';
  if (ticketRequest?.archivedAt) return 'Archivé';
  if (ticketRequest?.type === 'recharge' && ticketRequest?.screenshotReceivedAt) return 'Paiement à vérifier';
  if (ticketRequest?.reopenedAt) return 'Réouvert';
  if (ticketRequest?.takenAt) return 'Pris en charge';
  return 'Ouvert';
}

function ticketHistoryRecord(ticketRequest, overrides = {}) {
  if (!ticketRequest) return null;

  return {
    id: ticketRequest.id || overrides.id || null,
    type: ticketRequest.type || overrides.type || null,
    channelId: ticketRequest.channelId || overrides.channelId || null,
    userId: ticketRequest.userId || overrides.userId || null,
    createdAt: ticketRequest.createdAt || overrides.createdAt || Date.now(),
    updatedAt: Date.now(),
    product: ticketRequest.product || null,
    price: ticketRequest.price ?? null,
    amount: ticketRequest.amount || null,
    method: ticketRequest.method || null,
    paymentDate: ticketRequest.paymentDate || null,
    paymentTime: ticketRequest.paymentTime || null,
    screenshotReceivedAt: ticketRequest.screenshotReceivedAt || null,
    takenAt: ticketRequest.takenAt || null,
    takenBy: ticketRequest.takenBy || null,
    paidAt: ticketRequest.paidAt || null,
    paidBy: ticketRequest.paidBy || null,
    validatedAmount: ticketRequest.validatedAmount || null,
    proofRejectedAt: ticketRequest.proofRejectedAt || null,
    proofRejectedBy: ticketRequest.proofRejectedBy || null,
    completedAt: ticketRequest.completedAt || null,
    completedBy: ticketRequest.completedBy || null,
    refundedAt: ticketRequest.refundedAt || null,
    refundedBy: ticketRequest.refundedBy || null,
    refundedAmount: ticketRequest.refundedAmount ?? null,
    archivedAt: ticketRequest.archivedAt || null,
    archivedBy: ticketRequest.archivedBy || null,
    reopenedAt: ticketRequest.reopenedAt || null,
    reopenedBy: ticketRequest.reopenedBy || null,
    deletedAt: ticketRequest.deletedAt || null,
    deletedBy: ticketRequest.deletedBy || null,
    deletedReason: ticketRequest.deletedReason || null,
    ...overrides
  };
}

function upsertTicketHistory(ticketRequest, overrides = {}) {
  const record = ticketHistoryRecord(ticketRequest, overrides);
  if (!record?.userId) return;

  const entries = ensureTicketHistory(record.userId);
  const index = entries.findIndex(entry => (
    (record.id && entry.id === record.id) ||
    (record.channelId && entry.channelId === record.channelId)
  ));
  const merged = index >= 0 ? { ...entries[index], ...record, updatedAt: Date.now() } : record;

  if (index >= 0) {
    entries.splice(index, 1);
  }

  entries.unshift(merged);
  ticketHistory.users[record.userId] = entries
    .sort((a, b) => Number(b.updatedAt || b.createdAt || 0) - Number(a.updatedAt || a.createdAt || 0))
    .slice(0, TICKET_HISTORY_LIMIT);
  saveTicketHistory();
}

function currentTicketHistoryRecords(userId) {
  return Object.values(requests.tickets || {})
    .filter(ticketRequest => ticketRequest?.userId === userId)
    .map(ticketRequest => ticketHistoryRecord(ticketRequest))
    .filter(Boolean);
}

function getTicketHistoryRows(userId) {
  const rows = new Map();

  for (const entry of ensureTicketHistory(userId)) {
    const key = entry.id || entry.channelId;
    if (key) rows.set(key, entry);
  }

  for (const entry of currentTicketHistoryRecords(userId)) {
    const key = entry.id || entry.channelId;
    if (key) rows.set(key, { ...rows.get(key), ...entry });
  }

  return [...rows.values()]
    .sort((a, b) => Number(b.createdAt || b.updatedAt || 0) - Number(a.createdAt || a.updatedAt || 0))
    .slice(0, 10);
}

function formatTicketHistoryLine(ticketRequest, index) {
  const openedAt = ticketRequest.createdAt ? `<t:${Math.floor(ticketRequest.createdAt / 1000)}:f>` : 'Date inconnue';
  const channel = ticketRequest.channelId ? `<#${ticketRequest.channelId}>` : 'Salon inconnu';
  const details = [];

  if (ticketRequest.type === 'commande') {
    details.push(`Produit : **${ticketRequest.product || 'Non précisé'}**`);
    if (ticketRequest.price !== null && ticketRequest.price !== undefined) details.push(`Payé : **${formatWalletAmount(Number(ticketRequest.price) || 0)}**`);
    if (ticketRequest.refundedAmount !== null && ticketRequest.refundedAmount !== undefined) details.push(`Remboursé : **${formatWalletAmount(Number(ticketRequest.refundedAmount) || 0)}**`);
  }

  if (ticketRequest.type === 'recharge') {
    details.push(`Montant : **${ticketRequest.amount || 'Non précisé'}**`);
    if (ticketRequest.method) details.push(`Paiement : **${paymentLabel(ticketRequest.method)}**`);
  }

  if (ticketRequest.deletedReason) details.push(`Raison suppression : **${ticketRequest.deletedReason}**`);

  return [
    `**${index + 1}. #${ticketRequest.id || 'inconnu'} — ${ticketTypeLabel(ticketRequest.type)}**`,
    `Statut : **${ticketStatusLabel(ticketRequest)}**`,
    ...details,
    `Ouvert : ${openedAt}`,
    `Ticket : ${channel}`
  ].join('\n');
}

function buildTicketHistoryEmbed(user) {
  const rows = getTicketHistoryRows(user.id);
  const description = rows.length
    ? rows.map(formatTicketHistoryLine).join('\n\n')
    : 'Aucun ticket enregistré pour ce membre depuis l’activation de l’historique.';

  return new EmbedBuilder()
    .setColor(0x3498DB)
    .setTitle('🎫 Historique tickets')
    .setDescription(description)
    .addFields({
      name: 'Membre',
      value: `${user}`,
      inline: false
    })
    .setThumbnail(user.displayAvatarURL({ dynamic: true }))
    .setFooter({ text: 'Historique limité aux 10 derniers tickets affichés' })
    .setTimestamp();
}

function recordShopRecharge(amount, isRechargeValidation = false) {
  shopStats.totalRechargedCents = (Number(shopStats.totalRechargedCents) || 0) + eurosToCents(amount);
  if (isRechargeValidation) {
    shopStats.rechargeValidatedCount = (Number(shopStats.rechargeValidatedCount) || 0) + 1;
  }
  saveShopStats();
}

function recordShopRemove(amount) {
  shopStats.totalRemovedCents = (Number(shopStats.totalRemovedCents) || 0) + eurosToCents(amount);
  saveShopStats();
}

function recordShopOrderCreated(productLabel, price) {
  shopStats.ordersCreated = (Number(shopStats.ordersCreated) || 0) + 1;

  const productKey = productLabel || 'Produit inconnu';
  const productStats = shopStats.products[productKey] || { count: 0, revenueCents: 0 };
  productStats.count = (Number(productStats.count) || 0) + 1;
  productStats.revenueCents = (Number(productStats.revenueCents) || 0) + eurosToCents(price);
  shopStats.products[productKey] = productStats;

  saveShopStats();
}

function recordShopOrderCompleted(ticketRequest) {
  if (!ticketRequest || ticketRequest.statsOrderCompletedAt) return false;

  shopStats.ordersCompleted = (Number(shopStats.ordersCompleted) || 0) + 1;
  ticketRequest.statsOrderCompletedAt = Date.now();
  saveShopStats();
  return true;
}

function recordShopOrderRefunded(ticketRequest) {
  if (!ticketRequest || ticketRequest.statsOrderRefundedAt) return false;

  shopStats.ordersRefunded = (Number(shopStats.ordersRefunded) || 0) + 1;
  shopStats.totalRefundedCents = (Number(shopStats.totalRefundedCents) || 0) + eurosToCents(ticketRequest.refundedAmount || ticketRequest.price || 0);
  ticketRequest.statsOrderRefundedAt = Date.now();
  saveShopStats();
  return true;
}

function buildShopStatsSnapshot() {
  const ticketList = Object.values(requests.tickets || {});
  const activeTickets = ticketList.filter(isActiveTicketRequest);
  const walletRows = Object.entries(wallets || {})
    .map(([userId, wallet]) => ({
      userId,
      balance: Number(wallet?.balance) || 0
    }));
  const totalWalletCents = walletRows.reduce((sum, row) => sum + eurosToCents(row.balance), 0);
  const topClients = walletRows
    .filter(row => row.balance > 0)
    .sort((a, b) => b.balance - a.balance)
    .slice(0, 5);
  const topProducts = Object.entries(shopStats.products || {})
    .map(([label, stats]) => ({
      label,
      count: Number(stats?.count) || 0,
      revenueCents: Number(stats?.revenueCents) || 0
    }))
    .filter(row => row.count > 0)
    .sort((a, b) => b.count - a.count || b.revenueCents - a.revenueCents)
    .slice(0, 5);

  return {
    totalRechargedCents: Number(shopStats.totalRechargedCents) || 0,
    totalRemovedCents: Number(shopStats.totalRemovedCents) || 0,
    totalWalletCents,
    ordersCreated: Number(shopStats.ordersCreated) || 0,
    ordersCompleted: Number(shopStats.ordersCompleted) || 0,
    ordersRefunded: Number(shopStats.ordersRefunded) || 0,
    totalRefundedCents: Number(shopStats.totalRefundedCents) || 0,
    rechargeValidatedCount: Number(shopStats.rechargeValidatedCount) || 0,
    openTickets: activeTickets.length,
    openSupportTickets: activeTickets.filter(ticket => ticket.type === 'support').length,
    pendingRechargeTickets: activeTickets.filter(ticket => ticket.type === 'recharge' && !ticket.paidAt).length,
    openOrderTickets: activeTickets.filter(ticket => ticket.type === 'commande' && !ticket.completedAt).length,
    topClients,
    topProducts
  };
}

function buildShopStatsEmbed() {
  const snapshot = buildShopStatsSnapshot();
  const topClients = snapshot.topClients
    .map((row, index) => `**${index + 1}.** <@${row.userId}> — **${formatWalletAmount(row.balance)}**`)
    .join('\n') || 'Aucun client avec solde positif.';
  const topProducts = snapshot.topProducts
    .map((row, index) => `**${index + 1}.** ${row.label}\nCommandes : **${row.count}** • Total : **${formatCents(row.revenueCents)}**`)
    .join('\n\n') || 'Aucun produit enregistré depuis l’activation des stats.';

  return new EmbedBuilder()
    .setColor(0x3498DB)
    .setTitle('📊 Stats boutique')
    .setDescription('Statistiques enregistrées depuis l’activation du suivi boutique.')
    .addFields(
      {
        name: 'Argent',
        value: [
          `Total rechargé : **${formatCents(snapshot.totalRechargedCents)}**`,
          `Total retiré : **${formatCents(snapshot.totalRemovedCents)}**`,
          `Total remboursé : **${formatCents(snapshot.totalRefundedCents)}**`,
          `Solde total actuel : **${formatCents(snapshot.totalWalletCents)}**`
        ].join('\n'),
        inline: false
      },
      {
        name: 'Commandes et recharges',
        value: [
          `Commandes créées : **${snapshot.ordersCreated}**`,
          `Commandes terminées : **${snapshot.ordersCompleted}**`,
          `Commandes remboursées : **${snapshot.ordersRefunded}**`,
          `Recharges validées : **${snapshot.rechargeValidatedCount}**`
        ].join('\n'),
        inline: false
      },
      {
        name: 'Tickets',
        value: [
          `Tickets ouverts : **${snapshot.openTickets}**`,
          `Tickets commande ouverts : **${snapshot.openOrderTickets}**`,
          `Tickets support : **${snapshot.openSupportTickets}**`,
          `Tickets recharge en attente : **${snapshot.pendingRechargeTickets}**`
        ].join('\n'),
        inline: false
      },
      { name: 'Top 5 clients', value: topClients, inline: false },
      { name: 'Top produits commandés', value: topProducts, inline: false }
    )
    .setTimestamp();
}

function createWalletActionId() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function walletActionLabel(action) {
  return action === 'add' ? 'ajout' : 'retrait';
}

function walletActionVerb(action) {
  return action === 'add' ? 'ajouter' : 'retirer';
}

function walletActionColor(action) {
  return action === 'add' ? 0x2ECC71 : 0xE67E22;
}

function walletConfirmationButtons(actionId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`confirm_wallet_action:${actionId}`)
      .setLabel('Confirmer')
      .setEmoji('✅')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`cancel_wallet_action:${actionId}`)
      .setLabel('Annuler')
      .setEmoji('❌')
      .setStyle(ButtonStyle.Secondary)
  );
}

function refundConfirmationButtons(actionId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`confirm_refund_action:${actionId}`)
      .setLabel('Confirmer')
      .setEmoji('✅')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`cancel_refund_action:${actionId}`)
      .setLabel('Annuler')
      .setEmoji('❌')
      .setStyle(ButtonStyle.Secondary)
  );
}

function rechargeProofReviewButtons(requestId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`accept_recharge_proof:${requestId}`)
      .setLabel('Paiement reçu')
      .setEmoji('✅')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`reject_recharge_proof:${requestId}`)
      .setLabel('Preuve refusée')
      .setEmoji('❌')
      .setStyle(ButtonStyle.Danger)
  );
}

function buildRechargeProofReviewEmbed(ticketRequest, screenshotUrl) {
  const methodName = paymentLabel(ticketRequest.method);

  return new EmbedBuilder()
    .setColor(0xF1C40F)
    .setTitle('📸 Screenshot recharge reçu')
    .setDescription([
      `🧾 Demande : **${ticketRequest.id}**`,
      `👤 Client : <@${ticketRequest.userId}>`,
      `💶 Montant demandé : **${ticketRequest.amount}**`,
      `💳 Méthode : **${methodName}**`,
      `📅 Date indiquée : **${ticketRequest.paymentDate || 'Non précisée'}**`,
      `🕒 Heure indiquée : **${ticketRequest.paymentTime || 'Non précisée'}**`,
      screenshotUrl ? `📎 Screenshot : ${screenshotUrl}` : null,
      '',
      '**À vérifier avant de confirmer :**',
      '• montant reçu',
      '• date / heure',
      '• destinataire',
      '• aucune note / libellé interdit',
      '',
      '✅ **Paiement reçu** crédite le solde automatiquement.',
      '❌ **Preuve refusée** prévient le client en MP pour renvoyer une preuve.'
    ].filter(Boolean).join('\n'))
    .setImage(screenshotUrl || null)
    .setTimestamp();
}

async function createWalletActionConfirmation(message, action, user, amount, ticketRequest) {
  const actionId = createWalletActionId();
  const amountText = formatWalletAmount(amount);
  const confirmation = await message.channel.send({
    embeds: [
      new EmbedBuilder()
        .setColor(walletActionColor(action))
        .setTitle(`⚠️ Confirmer ${walletActionLabel(action)} de solde`)
        .setDescription([
          `Owner : ${message.author}`,
          `Membre : ${user}`,
          `Montant : **${amountText}**`,
          ticketRequest ? `Demande : **${ticketRequest.id}**` : null,
          '',
          `Confirmer pour ${walletActionVerb(action)} ce montant au portefeuille du membre.`
        ].filter(Boolean).join('\n'))
    ],
    components: [walletConfirmationButtons(actionId)]
  });

  const timer = setTimeout(() => {
    if (!pendingWalletActions.has(actionId)) return;

    pendingWalletActions.delete(actionId);
    confirmation.edit({
      embeds: [
        new EmbedBuilder()
          .setColor(0x95A5A6)
          .setTitle('⏱️ Confirmation expirée')
          .setDescription(`L’action ${walletActionLabel(action)} de **${amountText}** pour ${user} a expiré.`)
      ],
      components: []
    }).catch(() => {});
  }, WALLET_CONFIRMATION_TTL);

  timer.unref?.();

  pendingWalletActions.set(actionId, {
    action,
    amount,
    adminId: message.author.id,
    channelId: message.channel.id,
    guildId: message.guild.id,
    targetUserId: user.id,
    ticketRequestId: ticketRequest?.id || null,
    timer
  });
}

function clearPendingWalletAction(actionId) {
  const pendingAction = pendingWalletActions.get(actionId);
  if (pendingAction?.timer) clearTimeout(pendingAction.timer);
  pendingWalletActions.delete(actionId);
  return pendingAction;
}

function clearPendingRefundAction(actionId) {
  const pendingAction = pendingRefundActions.get(actionId);
  if (pendingAction?.timer) clearTimeout(pendingAction.timer);
  pendingRefundActions.delete(actionId);
  return pendingAction;
}

async function applyWalletAdd({ user, amount, channel, guild, adminUser, ticketRequest }) {
  const isRechargeValidation = ticketRequest && ticketRequest.type === 'recharge' && ticketRequest.userId === user.id;

  if (isRechargeValidation && ticketRequest.paidAt) {
    throw new Error('Cette recharge a déjà été validée.');
  }

  if (!wallets[user.id]) wallets[user.id] = { balance: 0 };
  wallets[user.id].balance += amount;
  saveWallets();
  recordWalletHistory(user.id, {
    type: isRechargeValidation ? 'recharge' : 'add',
    amountCents: eurosToCents(amount),
    balanceAfterCents: eurosToCents(wallets[user.id].balance),
    actorId: adminUser.id,
    ticketRequestId: ticketRequest?.id || null,
    note: isRechargeValidation ? `Méthode : ${paymentLabel(ticketRequest.method)}` : null
  });
  recordShopRecharge(amount, isRechargeValidation);

  if (isRechargeValidation) {
    const amountText = formatWalletAmount(amount);
    const newBalanceText = formatWalletAmount(wallets[user.id].balance);
    const methodName = paymentLabel(ticketRequest.method);

    ticketRequest.paidAt = Date.now();
    ticketRequest.paidBy = adminUser.id;
    ticketRequest.validatedAmount = amountText;
    saveRequests();
    upsertTicketHistory(ticketRequest);
    await renameTicketChannelState(channel, ticketRequest, 'valide');

    const dmEmbed = new EmbedBuilder()
      .setColor(0x2ECC71)
      .setTitle('✅ Recharge validée')
      .setDescription([
        'Ta recharge a été validée avec succès.',
        '',
        `🧾 Demande : n°${ticketRequest.id}`,
        `💰 Montant ajouté : **${amountText}**`,
        `👤 Pris en charge par : **${adminUser.tag}**`,
        '',
        'Ton solde est maintenant disponible sur la boutique.',
        `Tu peux maintenant retourner dans le salon boutique pour commander : <#${SHOP_CHANNEL_ID}>`
      ].join('\n'));

    let dmSent = false;
    await user.send({ embeds: [dmEmbed] })
      .then(() => { dmSent = true; })
      .catch(async () => {
        const warn = await channel.send('⚠️ Impossible d’envoyer un MP au client. Le ticket reste ouvert.');
        deleteLater(warn);
      });

    await channel.send({
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
      `Admin : ${logUser(adminUser)}`,
      `Client : ${logUser(user)}`,
      `Demande : **${ticketRequest.id}**`,
      `Méthode : **${methodName}**`,
      `Montant ajouté : **${amountText}**`,
      `Nouveau solde : **${newBalanceText}**`,
      `Ticket : ${logChannel(channel)}`,
      dmSent ? 'MP client : envoyé' : 'MP client : non envoyé'
    ], dmSent ? 0x2ECC71 : 0xF1C40F);

    const referralReward = await validateReferralReward(user, ticketRequest, amountText, guild);
    if (referralReward) {
      await channel.send({
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

    scheduleDataBackup('recharge_validated', adminUser);

    if (dmSent) {
      await channel.send('✅ Le ticket sera déplacé dans les tickets supprimés dans 10 secondes.');
      setTimeout(() => {
        archiveTicketChannel(channel, ticketRequest, adminUser, ticketRequest.userId)
          .then(() => {
            sendAdminLog('📁 Ticket recharge archivé', [
              `Admin : ${logUser(adminUser)}`,
              `Ticket : ${logChannel(channel)}`,
              `Demande : **${ticketRequest.id}**`,
              `Client : <@${ticketRequest.userId}>`
            ], 0xE67E22);
          })
          .catch(error => {
            sendAdminLog('⚠️ Archivage ticket impossible', [
              `Admin : ${logUser(adminUser)}`,
              `Ticket : ${logChannel(channel)}`,
              `Demande : **${ticketRequest.id}**`,
              `Erreur : \`${error.message}\``
            ], 0xE74C3C);
          });
      }, 10_000);
    }

    return;
  }

  scheduleDataBackup('wallet_add', adminUser);

  await sendAdminLog('💰 Solde ajouté', [
    `Admin : ${logUser(adminUser)}`,
    `Membre : ${logUser(user)}`,
    `Montant ajouté : **${formatWalletAmount(amount)}**`,
    `Nouveau solde : **${formatWalletAmount(wallets[user.id].balance)}**`,
    `Salon : ${logChannel(channel)}`
  ], 0x2ECC71);

  await channel.send({
    embeds: [
      new EmbedBuilder()
        .setColor(0x2ECC71)
        .setTitle('✅ Solde ajouté')
        .setDescription(`**${formatWalletAmount(amount)}** ont été ajoutés au portefeuille de ${user}.`)
    ]
  });
}

async function applyWalletRemove({ user, amount, channel, adminUser }) {
  if (!wallets[user.id]) wallets[user.id] = { balance: 0 };
  wallets[user.id].balance -= amount;
  saveWallets();
  recordWalletHistory(user.id, {
    type: 'remove',
    amountCents: -eurosToCents(amount),
    balanceAfterCents: eurosToCents(wallets[user.id].balance),
    actorId: adminUser.id
  });
  recordShopRemove(amount);
  scheduleDataBackup('wallet_remove', adminUser);

  await sendAdminLog('💸 Solde retiré', [
    `Admin : ${logUser(adminUser)}`,
    `Membre : ${logUser(user)}`,
    `Montant retiré : **${formatWalletAmount(amount)}**`,
    `Nouveau solde : **${formatWalletAmount(wallets[user.id].balance)}**`,
    `Salon : ${logChannel(channel)}`
  ], 0xE67E22);

  await channel.send({
    embeds: [
      new EmbedBuilder()
        .setColor(0xE67E22)
        .setTitle('✅ Solde retiré')
        .setDescription(`**${formatWalletAmount(amount)}** ont été retirés du portefeuille de ${user}.`)
    ]
  });
}

async function createRefundConfirmation(message, ticketRequest) {
  if (!ticketRequest || ticketRequest.type !== 'commande') {
    const reply = await message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0xE74C3C)
          .setTitle('❌ Ticket commande requis')
          .setDescription('Utilisation : `!refund` directement dans un ticket commande.')
      ]
    });

    deleteLater(reply);
    return false;
  }

  if (ticketRequest.refundedAt) {
    const reply = await message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0xE67E22)
          .setTitle('💸 Commande déjà remboursée')
          .setDescription([
            `Demande : **#${ticketRequest.id}**`,
            `Remboursée par : <@${ticketRequest.refundedBy}>`,
            ticketRequest.refundedAt ? `Date : <t:${Math.floor(ticketRequest.refundedAt / 1000)}:f>` : null,
            `Montant : **${formatWalletAmount(Number(ticketRequest.refundedAmount || ticketRequest.price) || 0)}**`
          ].filter(Boolean).join('\n'))
      ]
    });

    deleteLater(reply, 15_000);
    return false;
  }

  const amount = Number(ticketRequest.price);
  if (!ticketRequest.userId || !Number.isFinite(amount) || amount <= 0) {
    const reply = await message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0xE74C3C)
          .setTitle('❌ Remboursement impossible')
          .setDescription('Le client ou le montant payé est introuvable sur cette demande.')
      ]
    });

    deleteLater(reply);
    return false;
  }

  const actionId = createWalletActionId();
  const amountText = formatWalletAmount(amount);
  const confirmation = await message.channel.send({
    embeds: [
      new EmbedBuilder()
        .setColor(0xE67E22)
        .setTitle('⚠️ Confirmer le remboursement')
        .setDescription([
          `Owner : ${message.author}`,
          `Demande : **#${ticketRequest.id}**`,
          `Client : <@${ticketRequest.userId}>`,
          `Produit : **${ticketRequest.product || 'Non précisé'}**`,
          `Montant rendu au solde : **${amountText}**`,
          '',
          'Confirmer le remboursement de cette commande ?'
        ].join('\n'))
    ],
    components: [refundConfirmationButtons(actionId)]
  });

  const timer = setTimeout(() => {
    if (!pendingRefundActions.has(actionId)) return;

    pendingRefundActions.delete(actionId);
    confirmation.edit({
      embeds: [
        new EmbedBuilder()
          .setColor(0x95A5A6)
          .setTitle('⏱️ Confirmation expirée')
          .setDescription(`Le remboursement de **${amountText}** pour la demande **#${ticketRequest.id}** a expiré.`)
      ],
      components: []
    }).catch(() => {});
  }, WALLET_CONFIRMATION_TTL);

  timer.unref?.();

  pendingRefundActions.set(actionId, {
    ownerId: message.author.id,
    channelId: message.channel.id,
    guildId: message.guild.id,
    ticketRequestId: ticketRequest.id,
    amount,
    timer
  });
}

async function refundOrderTicket(message, ticketRequest) {
  if (!ticketRequest || ticketRequest.type !== 'commande') {
    const reply = await message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0xE74C3C)
          .setTitle('❌ Ticket commande requis')
          .setDescription('Utilisation : `!refund` directement dans un ticket commande.')
      ]
    });

    deleteLater(reply);
    return false;
  }

  if (ticketRequest.refundedAt) {
    const reply = await message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0xE67E22)
          .setTitle('💸 Commande déjà remboursée')
          .setDescription([
            `Demande : **#${ticketRequest.id}**`,
            `Remboursée par : <@${ticketRequest.refundedBy}>`,
            ticketRequest.refundedAt ? `Date : <t:${Math.floor(ticketRequest.refundedAt / 1000)}:f>` : null,
            `Montant : **${formatWalletAmount(Number(ticketRequest.refundedAmount || ticketRequest.price) || 0)}**`
          ].filter(Boolean).join('\n'))
      ]
    });

    deleteLater(reply, 15_000);
    return false;
  }

  const amount = Number(ticketRequest.price);
  if (!ticketRequest.userId || !Number.isFinite(amount) || amount <= 0) {
    const reply = await message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0xE74C3C)
          .setTitle('❌ Remboursement impossible')
          .setDescription('Le client ou le montant payé est introuvable sur cette demande.')
      ]
    });

    deleteLater(reply);
    return false;
  }

  if (!wallets[ticketRequest.userId]) wallets[ticketRequest.userId] = { balance: 0 };
  wallets[ticketRequest.userId].balance += amount;

  ticketRequest.refundedAt = Date.now();
  ticketRequest.refundedBy = message.author.id;
  ticketRequest.refundedAmount = amount;

  recordShopOrderRefunded(ticketRequest);
  saveWallets();
  saveRequests();
  upsertTicketHistory(ticketRequest);
  recordWalletHistory(ticketRequest.userId, {
    type: 'refund',
    amountCents: eurosToCents(amount),
    balanceAfterCents: eurosToCents(wallets[ticketRequest.userId].balance),
    actorId: message.author.id,
    ticketRequestId: ticketRequest.id,
    product: ticketRequest.product || null,
    note: 'Remboursement de commande'
  });
  scheduleDataBackup('order_refunded', message.author);

  const newBalanceText = formatWalletAmount(wallets[ticketRequest.userId].balance);
  const refundText = formatWalletAmount(amount);

  await sendAdminLog('💸 Commande remboursée', [
    `Owner : ${logUser(message.author)}`,
    `Ticket : ${logChannel(message.channel)}`,
    `Demande : **${ticketRequest.id}**`,
    `Client : <@${ticketRequest.userId}>`,
    `Produit : **${ticketRequest.product || 'Non précisé'}**`,
    `Montant rendu au solde : **${refundText}**`,
    `Nouveau solde : **${newBalanceText}**`
  ], 0xE67E22);

  await message.channel.send({
    embeds: [
      new EmbedBuilder()
        .setColor(0xE67E22)
        .setTitle('💸 Commande remboursée')
        .setDescription([
          'Cette commande a été remboursée par un owner.',
          '',
          `🧾 Demande : #${ticketRequest.id}`,
          `👤 Client : <@${ticketRequest.userId}>`,
          `📦 Produit : ${ticketRequest.product || 'Non précisé'}`,
          `💰 Montant rendu au solde : **${refundText}**`,
          `👛 Nouveau solde : **${newBalanceText}**`,
          '',
          'Le montant a été recrédité sur le portefeuille du client.',
          'Aucun nouveau produit n’a été envoyé.'
        ].join('\n'))
        .setTimestamp()
    ]
  });

  return true;
}

async function executeWalletAction(interaction, pendingAction) {
  const channel = interaction.guild?.channels.cache.get(pendingAction.channelId)
    || await interaction.guild?.channels.fetch(pendingAction.channelId).catch(() => null);
  const user = await client.users.fetch(pendingAction.targetUserId).catch(() => null);

  if (!channel || !user) {
    throw new Error('Salon ou membre introuvable.');
  }

  const ticketRequest = getTicketRequest(channel.id);
  const context = {
    user,
    amount: pendingAction.amount,
    channel,
    guild: interaction.guild,
    adminUser: interaction.user,
    ticketRequest
  };

  if (pendingAction.action === 'add') {
    await applyWalletAdd(context);
    return;
  }

  await applyWalletRemove(context);
}

async function handleWalletActionButton(interaction) {
  const isConfirm = interaction.customId.startsWith('confirm_wallet_action:');
  const actionId = interaction.customId.split(':')[1];
  const pendingAction = pendingWalletActions.get(actionId);

  if (!pendingAction) {
    return interaction.reply({
      content: '⏱️ Cette confirmation a expiré ou a déjà été utilisée.',
      ephemeral: true
    });
  }

  if (interaction.user.id !== pendingAction.adminId) {
    return interaction.reply({
      content: '❌ Seul l’owner qui a lancé cette commande peut confirmer ou annuler.',
      ephemeral: true
    });
  }

  if (!isOwnerMember(interaction.member)) {
    return interaction.reply({
      content: '❌ Seul le rôle owner peut confirmer cette action.',
      ephemeral: true
    });
  }

  clearPendingWalletAction(actionId);

  if (!isConfirm) {
    return interaction.update({
      embeds: [
        new EmbedBuilder()
          .setColor(0x95A5A6)
          .setTitle('❌ Action annulée')
          .setDescription('Aucune modification de solde n’a été appliquée.')
      ],
      components: []
    });
  }

  await interaction.update({
    embeds: [
      new EmbedBuilder()
        .setColor(walletActionColor(pendingAction.action))
        .setTitle('⏳ Action confirmée')
        .setDescription('Application de la modification de solde en cours...')
    ],
    components: []
  });

  try {
    await executeWalletAction(interaction, pendingAction);
    await interaction.message.edit({
      embeds: [
        new EmbedBuilder()
          .setColor(walletActionColor(pendingAction.action))
          .setTitle('✅ Action appliquée')
          .setDescription('La modification de solde a été appliquée avec succès.')
      ],
      components: []
    }).catch(() => {});
  } catch (error) {
    await reportCrash('Confirmation solde impossible', error, [
      `Action : **${pendingAction.action}**`,
      `Membre : <@${pendingAction.targetUserId}>`,
      `Montant : **${formatWalletAmount(pendingAction.amount)}**`
    ]);

    await interaction.followUp({
      content: `❌ Impossible d’appliquer la modification : ${error.message}`,
      ephemeral: true
    }).catch(() => {});
  }
}

function getRechargeProofReviewRequest(interaction, requestId) {
  const ticketRequest = getTicketRequest(interaction.channel?.id);

  if (!ticketRequest || ticketRequest.type !== 'recharge' || ticketRequest.id !== requestId) {
    throw new Error('Ticket recharge introuvable ou invalide.');
  }

  if (ticketRequest.paidAt) {
    throw new Error('Cette recharge a déjà été validée.');
  }

  if (!ticketRequest.screenshotReceivedAt || !ticketRequest.screenshotUrl) {
    throw new Error('Aucun screenshot n’est en attente de vérification.');
  }

  return ticketRequest;
}

async function handleRechargeProofButton(interaction) {
  const [action, requestId] = interaction.customId.split(':');
  const isAccept = action === 'accept_recharge_proof';

  if (!isOwnerMember(interaction.member)) {
    return interaction.reply({
      content: '❌ Seul le rôle owner peut valider ou refuser une preuve de recharge.',
      ephemeral: true
    });
  }

  let ticketRequest;
  try {
    ticketRequest = getRechargeProofReviewRequest(interaction, requestId);
  } catch (error) {
    return interaction.reply({
      content: `❌ ${error.message}`,
      ephemeral: true
    });
  }

  if (isAccept) {
    const amount = parseWalletAmount(ticketRequest.amount);
    const user = await client.users.fetch(ticketRequest.userId).catch(() => null);

    if (!user || !Number.isFinite(amount) || amount <= 0) {
      return interaction.reply({
        content: '❌ Impossible de retrouver le client ou le montant de cette recharge.',
        ephemeral: true
      });
    }

    await interaction.update({
      embeds: [
        new EmbedBuilder()
          .setColor(0xF1C40F)
          .setTitle('⏳ Validation de la recharge')
          .setDescription([
            `Owner : ${interaction.user}`,
            `Client : <@${ticketRequest.userId}>`,
            `Demande : **${ticketRequest.id}**`,
            `Montant : **${ticketRequest.amount}**`,
            '',
            'Crédit du solde en cours...'
          ].join('\n'))
      ],
      components: []
    });

    try {
      await applyWalletAdd({
        user,
        amount,
        channel: interaction.channel,
        guild: interaction.guild,
        adminUser: interaction.user,
        ticketRequest
      });

      await interaction.message.edit({
        embeds: [
          new EmbedBuilder()
            .setColor(0x2ECC71)
            .setTitle('✅ Preuve validée')
            .setDescription([
              `Owner : ${interaction.user}`,
              `Client : ${user}`,
              `Demande : **${ticketRequest.id}**`,
              `Montant crédité : **${formatWalletAmount(amount)}**`,
              '',
              'Le solde a été crédité automatiquement.'
            ].join('\n'))
        ],
        components: []
      }).catch(() => {});
    } catch (error) {
      await reportCrash('Validation preuve recharge impossible', error, [
        `Owner : ${logUser(interaction.user)}`,
        `Client : <@${ticketRequest.userId}>`,
        `Demande : **${ticketRequest.id}**`
      ]);

      await interaction.message.edit({
        embeds: [
          new EmbedBuilder()
            .setColor(0xE74C3C)
            .setTitle('❌ Validation impossible')
            .setDescription(`Impossible de créditer cette recharge : ${error.message}`)
        ],
        components: []
      }).catch(() => {});

      await interaction.followUp({
        content: `❌ Impossible de créditer cette recharge : ${error.message}`,
        ephemeral: true
      }).catch(() => {});
    }

    return;
  }

  ticketRequest.proofRejectedAt = Date.now();
  ticketRequest.proofRejectedBy = interaction.user.id;
  saveRequests();
  upsertTicketHistory(ticketRequest);
  scheduleDataBackup('recharge_proof_rejected', interaction.user);

  await interaction.update({
    embeds: [
      new EmbedBuilder()
        .setColor(0xE74C3C)
        .setTitle('❌ Preuve refusée')
        .setDescription([
          `Owner : ${interaction.user}`,
          `Client : <@${ticketRequest.userId}>`,
          `Demande : **${ticketRequest.id}**`,
          `Montant : **${ticketRequest.amount}**`,
          '',
          'Le client va être prévenu en MP pour renvoyer un screenshot clair.'
        ].join('\n'))
    ],
    components: []
  });

  const user = await client.users.fetch(ticketRequest.userId).catch(() => null);
  let dmSent = false;

  if (user) {
    await user.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0xE74C3C)
          .setTitle('❌ Preuve de paiement refusée')
          .setDescription([
            `Ta preuve pour la recharge **${ticketRequest.id}** a été refusée.`,
            '',
            'Merci de renvoyer en MP un screenshot lisible du paiement complet.',
            'On doit voir clairement le montant, la date/heure et le destinataire.'
          ].join('\n'))
      ]
    })
      .then(() => { dmSent = true; })
      .catch(() => {});
  }

  await interaction.channel.send({
    embeds: [
      new EmbedBuilder()
        .setColor(dmSent ? 0xE74C3C : 0xF1C40F)
        .setTitle('❌ Preuve refusée')
        .setDescription([
          `Client : <@${ticketRequest.userId}>`,
          `Demande : **${ticketRequest.id}**`,
          dmSent ? '📩 MP envoyé au client.' : '⚠️ MP impossible à envoyer au client.'
        ].join('\n'))
    ]
  }).catch(() => {});

  await sendAdminLog('❌ Preuve recharge refusée', [
    `Owner : ${logUser(interaction.user)}`,
    `Client : <@${ticketRequest.userId}>`,
    `Demande : **${ticketRequest.id}**`,
    `Montant : **${ticketRequest.amount}**`,
    `Ticket : ${logChannel(interaction.channel)}`,
    dmSent ? 'MP client : envoyé' : 'MP client : non envoyé'
  ], dmSent ? 0xE74C3C : 0xF1C40F);
}

async function executeRefundAction(interaction, pendingAction) {
  const channel = interaction.guild?.channels.cache.get(pendingAction.channelId)
    || await interaction.guild?.channels.fetch(pendingAction.channelId).catch(() => null);

  if (!channel) {
    throw new Error('Salon de commande introuvable.');
  }

  const ticketRequest = getTicketRequest(channel.id);
  if (!ticketRequest || ticketRequest.id !== pendingAction.ticketRequestId || ticketRequest.type !== 'commande') {
    throw new Error('Ticket commande introuvable ou invalide.');
  }

  return refundOrderTicket({ author: interaction.user, channel }, ticketRequest);
}

async function handleRefundActionButton(interaction) {
  const isConfirm = interaction.customId.startsWith('confirm_refund_action:');
  const actionId = interaction.customId.split(':')[1];
  const pendingAction = pendingRefundActions.get(actionId);

  if (!pendingAction) {
    return interaction.reply({
      content: '⏱️ Cette confirmation a expiré ou a déjà été utilisée.',
      ephemeral: true
    });
  }

  if (interaction.user.id !== pendingAction.ownerId) {
    return interaction.reply({
      content: '❌ Seul l’owner qui a lancé le remboursement peut confirmer ou annuler.',
      ephemeral: true
    });
  }

  if (!isOwnerMember(interaction.member)) {
    return interaction.reply({
      content: '❌ Seul le rôle owner peut confirmer ce remboursement.',
      ephemeral: true
    });
  }

  clearPendingRefundAction(actionId);

  if (!isConfirm) {
    return interaction.update({
      embeds: [
        new EmbedBuilder()
          .setColor(0x95A5A6)
          .setTitle('❌ Remboursement annulé')
          .setDescription('Aucun argent n’a été rendu au portefeuille du client.')
      ],
      components: []
    });
  }

  await interaction.update({
    embeds: [
      new EmbedBuilder()
        .setColor(0xE67E22)
        .setTitle('⏳ Remboursement confirmé')
        .setDescription('Application du remboursement en cours...')
    ],
    components: []
  });

  try {
    const refunded = await executeRefundAction(interaction, pendingAction);
    await interaction.message.edit({
      embeds: [
        new EmbedBuilder()
          .setColor(refunded ? 0x2ECC71 : 0xE67E22)
          .setTitle(refunded ? '✅ Remboursement appliqué' : '⚠️ Remboursement non appliqué')
          .setDescription(refunded
            ? 'Le montant de la commande a été rendu au portefeuille du client.'
            : 'Le remboursement n’a pas été appliqué. Vérifie le message envoyé dans le ticket.')
      ],
      components: []
    }).catch(() => {});
  } catch (error) {
    await reportCrash('Confirmation remboursement impossible', error, [
      `Demande : **${pendingAction.ticketRequestId}**`,
      `Montant : **${formatWalletAmount(pendingAction.amount)}**`
    ]);

    await interaction.followUp({
      content: `❌ Impossible d’appliquer le remboursement : ${error.message}`,
      ephemeral: true
    }).catch(() => {});
  }
}

function isReferralExcludedMember(member) {
  const roles = member?.roles?.cache;

  return Boolean(
    REFERRAL_EXCLUDED_ROLE_IDS.some(roleId => roles?.has(roleId)) ||
    member?.permissions?.has?.(PermissionFlagsBits.Administrator)
  );
}

async function fetchGuildMemberForReferral(guild, userId) {
  if (!guild || !userId) return null;

  return guild.members.cache.get(userId)
    || await guild.members.fetch(userId).catch(() => null);
}

function isReferralCountable(referral) {
  return Boolean(referral && !referral.excludedAt);
}

function excludeReferral(referral, reason, saveNow = true) {
  if (!referral || referral.excludedAt) return false;

  referral.excludedAt = Date.now();
  referral.excludedReason = reason;
  if (saveNow) saveReferrals();
  return true;
}

function excludeReferralStats(userId, reason, saveNow = true) {
  if (!userId || !referrals.stats[userId]) return false;
  if (referrals.stats[userId].excludedAt) return false;

  referrals.stats[userId].excludedAt = Date.now();
  referrals.stats[userId].excludedReason = reason;
  if (saveNow) saveReferrals();
  return true;
}

async function syncReferralExclusions() {
  let excludedCount = 0;
  let excludedStatsCount = 0;

  for (const [invitedUserId, referral] of Object.entries(referrals.invitedBy || {})) {
    if (!isReferralCountable(referral)) continue;

    const guild = client.guilds.cache.get(referral.guildId);
    if (!guild) continue;

    const [invitedMember, inviterMember] = await Promise.all([
      fetchGuildMemberForReferral(guild, invitedUserId),
      fetchGuildMemberForReferral(guild, referral.inviterId)
    ]);

    const invitedExcluded = isReferralExcludedMember(invitedMember);
    const inviterExcluded = isReferralExcludedMember(inviterMember);

    if (inviterExcluded && excludeReferralStats(referral.inviterId, 'staff_or_owner', false)) {
      excludedStatsCount += 1;
    }

    if (invitedExcluded || inviterExcluded) {
      excludeReferral(referral, 'staff_or_owner', false);
      excludedCount += 1;
    }
  }

  if (excludedCount > 0 || excludedStatsCount > 0) {
    saveReferrals();
    await sendBotLog('👥 Parrainages staff/owner exclus', [
      `Parrainages désactivés : **${excludedCount}**`,
      `Compteurs masqués : **${excludedStatsCount}**`
    ].join('\n'), 0xF1C40F);
  }
}

async function excludeReferralsForStaffOrOwner(member) {
  if (!isReferralExcludedMember(member)) return;

  let excludedCount = 0;
  let excludedStatsCount = 0;
  const ownReferral = referrals.invitedBy?.[member.id];

  if (ownReferral && isReferralCountable(ownReferral)) {
    excludeReferral(ownReferral, 'staff_or_owner', false);
    excludedCount += 1;
  }

  Object.values(referrals.invitedBy || {}).forEach(referral => {
    if (referral.inviterId !== member.id || !isReferralCountable(referral)) return;

    excludeReferral(referral, 'staff_or_owner', false);
    excludedCount += 1;
  });

  if (excludeReferralStats(member.id, 'staff_or_owner', false)) {
    excludedStatsCount += 1;
  }

  if (excludedCount > 0 || excludedStatsCount > 0) {
    saveReferrals();
    await sendBotLog('👥 Parrainage staff/owner désactivé', [
      `Membre : ${logUser(member.user)}`,
      `Parrainages désactivés : **${excludedCount}**`,
      `Compteur masqué : **${excludedStatsCount > 0 ? 'oui' : 'non'}**`
    ].join('\n'), 0xF1C40F);
  }
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
    .filter(([, referral]) => referral.inviterId === userId && isReferralCountable(referral))
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

function buildReferralStatsEmbed(user) {
  const summary = getReferralSummary(user.id);
  const recentValidated = summary.validated
    .slice(-5)
    .map(referral => `✅ <@${referral.invitedUserId}>`)
    .join('\n') || 'Aucun filleul validé pour le moment.';
  const recentPending = summary.pending
    .slice(-5)
    .map(referral => `⏳ <@${referral.invitedUserId}>`)
    .join('\n') || 'Aucun filleul en attente.';

  return new EmbedBuilder()
    .setColor(0xD4AF37)
    .setTitle('👥 Mes filleuls')
    .setDescription([
      `✅ Filleuls validés : **${summary.validated.length}**`,
      `⏳ En attente de validation : **${summary.pending.length}**`,
      '',
      '**Derniers validés**',
      recentValidated,
      '',
      '**En attente**',
      recentPending
    ].join('\n'))
    .setThumbnail(user.displayAvatarURL({ dynamic: true }))
    .setFooter({ text: 'Un filleul est validé après sa première recharge.' })
    .setTimestamp();
}

function buildReferralLeaderboard() {
  const leaderboard = new Map();

  Object.values(referrals.invitedBy).forEach(referral => {
    if (!isReferralCountable(referral)) return;
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
    if (stats?.excludedAt) return;

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

  const inviterMember = await fetchGuildMemberForReferral(member.guild, inviterId);
  if (isReferralExcludedMember(member) || isReferralExcludedMember(inviterMember)) {
    if (isReferralExcludedMember(inviterMember)) excludeReferralStats(inviterId, 'staff_or_owner');
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

async function notifyInviterOfPendingReferral(member, referral) {
  if (!referral || !isReferralCountable(referral) || referral.joinDmSentAt || !referral.inviterId) return false;

  const inviterMember = await fetchGuildMemberForReferral(member.guild, referral.inviterId);
  if (isReferralExcludedMember(member) || isReferralExcludedMember(inviterMember)) {
    if (isReferralExcludedMember(inviterMember)) excludeReferralStats(referral.inviterId, 'staff_or_owner');
    excludeReferral(referral, 'staff_or_owner');
    return false;
  }

  const inviter = await client.users.fetch(referral.inviterId).catch(() => null);
  if (!inviter) return false;

  const summary = getReferralSummary(inviter.id);
  const sent = await inviter.send({
    embeds: [
      new EmbedBuilder()
        .setColor(0xD4AF37)
        .setTitle('👥 Nouveau filleul détecté')
        .setDescription([
          `${member.user.tag} a rejoint le serveur avec ton lien de parrainage.`,
          '',
          'La récompense sera validée automatiquement après sa première recharge.',
          '',
          `✅ Filleuls validés : **${summary.validated.length}**`,
          `⏳ En attente de validation : **${summary.pending.length}**`
        ].join('\n'))
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: 'Parrainage • Validation après première recharge' })
        .setTimestamp()
    ]
  })
    .then(() => true)
    .catch(() => false);

  if (sent) {
    referral.joinDmSentAt = Date.now();
    saveReferrals();
  }

  return sent;
}

async function validateReferralReward(user, ticketRequest, amountText, guild = null) {
  const referral = referrals.invitedBy[user.id];
  if (!referral || !isReferralCountable(referral) || referral.validated || !referral.inviterId || referral.inviterId === user.id) {
    return null;
  }

  const [invitedMember, inviterMember] = await Promise.all([
    fetchGuildMemberForReferral(guild, user.id),
    fetchGuildMemberForReferral(guild, referral.inviterId)
  ]);

  if (isReferralExcludedMember(invitedMember) || isReferralExcludedMember(inviterMember)) {
    if (isReferralExcludedMember(inviterMember)) excludeReferralStats(referral.inviterId, 'staff_or_owner');
    excludeReferral(referral, 'staff_or_owner');
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
  recordWalletHistory(inviter.id, {
    type: 'referral',
    amountCents: eurosToCents(totalReward),
    balanceAfterCents: eurosToCents(wallets[inviter.id].balance),
    actorId: client.user?.id || null,
    ticketRequestId: ticketRequest.id,
    note: `Filleul : ${user.tag}`
  });

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

function getProduct(productId) {
  return products.find(product => product.value === productId) || null;
}

function isProductAvailable(productId) {
  return productStockState.unavailable?.[productId] !== true;
}

function setProductAvailability(productId, available, user) {
  const product = getProduct(productId);
  if (!product) return false;

  if (available) {
    delete productStockState.unavailable[productId];
  } else {
    productStockState.unavailable[productId] = true;
  }

  productStockState.updatedAt = Date.now();
  productStockState.updatedBy = user?.id || null;
  saveProductStock();
  scheduleDataBackup(available ? 'stock_product_available' : 'stock_product_unavailable', user);
  return true;
}

function toggleProductAvailability(productId, user) {
  const nextAvailable = !isProductAvailable(productId);
  setProductAvailability(productId, nextAvailable, user);
  return nextAvailable;
}

function getDiscountPercent() {
  const percent = Number(discountState.percent);
  if (!Number.isFinite(percent) || percent <= 0) return 0;
  return Math.min(percent, 100);
}

function isDiscountActive() {
  return getDiscountPercent() > 0;
}

function getProductBasePrice(productId) {
  const product = getProduct(productId);
  if (!product) return undefined;

  const override = Number(productPriceOverrides[productId]);
  return Number.isFinite(override) && override > 0 ? override : product.price;
}

function getProductPrice(productId) {
  const basePrice = getProductBasePrice(productId);
  if (basePrice === undefined) return undefined;

  const discountPercent = getDiscountPercent();
  if (!discountPercent) return basePrice;

  const baseCents = eurosToCents(basePrice);
  const discountedCents = Math.max(0, Math.round(baseCents * (100 - discountPercent) / 100));
  return discountedCents / 100;
}

function setProductPrice(productId, price, user = null) {
  const product = getProduct(productId);
  if (!product || !Number.isFinite(price) || price <= 0) return false;

  productPriceOverrides[productId] = Math.round(price * 100) / 100;
  saveProductPrices();
  scheduleDataBackup('product_price_changed', user);
  return true;
}

function setGlobalDiscount(percent, user) {
  discountState.percent = Math.round(percent * 100) / 100;
  discountState.updatedAt = Date.now();
  discountState.updatedBy = user?.id || null;
  saveDiscountState();
  scheduleDataBackup('discount_enabled', user);
}

function resetGlobalDiscount(user) {
  discountState.percent = 0;
  discountState.updatedAt = Date.now();
  discountState.updatedBy = user?.id || null;
  saveDiscountState();
  scheduleDataBackup('discount_reset', user);
}

function formatPercentValue(percent) {
  return Number.isInteger(percent) ? String(percent) : percent.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}

function formatDiscountPercent() {
  return formatPercentValue(getDiscountPercent());
}

function formatProductPrice(productId, options = {}) {
  const { includeDiscount = true, ignoreAvailability = false } = options;
  if (!ignoreAvailability && !isProductAvailable(productId)) return 'Indisponible';

  const basePrice = getProductBasePrice(productId);
  const price = getProductPrice(productId);

  if (price === undefined || basePrice === undefined) return 'Non défini';
  if (!includeDiscount || !isDiscountActive() || price === basePrice) return formatWalletAmount(price);

  return `${formatWalletAmount(price)} au lieu de ${formatWalletAmount(basePrice)} (-${formatDiscountPercent()}%)`;
}

function productPointsLabel(product) {
  return product.label
    .replace(/^McDonald'?s\s*/i, '')
    .replace(/\s+Points$/i, ' pts');
}

function buildPriceEditorRows() {
  const rows = [];

  for (let index = 0; index < products.length; index += 5) {
    const row = new ActionRowBuilder().addComponents(
      products.slice(index, index + 5).map(product => (
        new ButtonBuilder()
          .setCustomId(`edit_price:${product.value}`)
          .setLabel(`${productPointsLabel(product)} - ${formatProductPrice(product.value, { includeDiscount: false, ignoreAvailability: true })}`.slice(0, 80))
          .setEmoji(MCDONALDS_BUTTON_EMOJI)
          .setStyle(ButtonStyle.Primary)
      ))
    );

    rows.push(row);
  }

  return rows;
}

function stockButtonLabel(product) {
  return `${isProductAvailable(product.value) ? '✅' : '❌'} ${productPointsLabel(product)}`.slice(0, 80);
}

function buildStockEditorRows() {
  const rows = [];

  for (let index = 0; index < products.length; index += 5) {
    const row = new ActionRowBuilder().addComponents(
      products.slice(index, index + 5).map(product => (
        new ButtonBuilder()
          .setCustomId(`toggle_stock:${product.value}`)
          .setLabel(stockButtonLabel(product))
          .setStyle(isProductAvailable(product.value) ? ButtonStyle.Success : ButtonStyle.Danger)
      ))
    );

    rows.push(row);
  }

  return rows;
}

function buildStockEditorEmbed(guild) {
  const unavailableCount = products.filter(product => !isProductAvailable(product.value)).length;

  return new EmbedBuilder()
    .setColor(0xD4AF37)
    .setAuthor({ name: 'Stock McDonald\'s', iconURL: guild.iconURL({ dynamic: true }) })
    .setTitle(`Gestion du stock ${MCDONALDS_EMOJI}`)
    .setDescription([
      'Clique sur un produit pour changer son état.',
      '',
      '✅ Disponible',
      '❌ Indisponible',
      '',
      `Produits indisponibles : **${unavailableCount}/${products.length}**`,
      '',
      'Les produits indisponibles restent visibles dans Commander, mais ils ne peuvent pas être commandés.'
    ].join('\n'))
    .setFooter({ text: 'Owner • Gestion du stock' });
}

function productMenuLabel(product) {
  const label = product.label.replace('Points', 'pts');
  return (isProductAvailable(product.value) ? label : `❌ ${label}`).slice(0, 100);
}

function productMenuDescription(product) {
  if (!isProductAvailable(product.value)) return 'Indisponible';
  return `Prix : ${formatProductPrice(product.value)}`;
}

const ticketAllow = [
  PermissionFlagsBits.ViewChannel,
  PermissionFlagsBits.SendMessages,
  PermissionFlagsBits.ReadMessageHistory
];
const ticketBotAllow = [
  ...ticketAllow,
  PermissionFlagsBits.ManageMessages
];

function botTicketPermissionOverwrites(guild) {
  const botId = guild.members.me?.id || client.user?.id;
  return botId ? [{ id: botId, allow: ticketBotAllow }] : [];
}

function ticketPermissionOverwrites(guild, userId) {
  return [
    { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
    ...botTicketPermissionOverwrites(guild),
    { id: userId, allow: ticketAllow },
    { id: TICKET_ACCESS_ROLE_ID, allow: ticketAllow },
    { id: ADMIN_ROLE_ID, allow: ticketAllow }
  ];
}

function adminTicketPermissionOverwrites(guild) {
  return [
    { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
    ...botTicketPermissionOverwrites(guild),
    { id: TICKET_ACCESS_ROLE_ID, allow: ticketAllow },
    { id: ADMIN_ROLE_ID, allow: ticketAllow }
  ];
}

function supportTicketPermissionOverwrites(guild, userId) {
  return [
    { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
    ...botTicketPermissionOverwrites(guild),
    { id: userId, allow: ticketAllow },
    { id: TICKET_ACCESS_ROLE_ID, allow: ticketAllow },
    { id: ADMIN_ROLE_ID, allow: ticketAllow }
  ];
}

function completedOrderTicketPermissionOverwrites(guild, userId) {
  return [
    { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
    ...botTicketPermissionOverwrites(guild),
    { id: userId, allow: ticketAllow },
    { id: TICKET_ACCESS_ROLE_ID, allow: ticketAllow },
    { id: ADMIN_ROLE_ID, allow: ticketAllow }
  ];
}

function archivedTicketPermissionOverwrites(guild, ticketRequest) {
  return [
    { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
    ...botTicketPermissionOverwrites(guild),
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
  return isOwnerMember(member);
}

function takeTicketButton(ownerId, ticketRequest = null) {
  const alreadyTaken = Boolean(ticketRequest?.takenBy);

  return new ButtonBuilder()
    .setCustomId(`take_ticket:${ownerId}`)
    .setLabel(alreadyTaken ? 'Pris en charge' : 'Prendre en charge')
    .setEmoji('🙋')
    .setStyle(alreadyTaken ? ButtonStyle.Secondary : ButtonStyle.Primary)
    .setDisabled(alreadyTaken);
}

function ticketButtons(ownerId, ticketRequest = null, options = {}) {
  const buttons = [];
  if (options.includeTake !== false) buttons.push(takeTicketButton(ownerId, ticketRequest));

  buttons.push(
    new ButtonBuilder()
      .setCustomId(`delete_ticket:${ownerId}`)
      .setLabel('Supprimer le ticket')
      .setEmoji('🗑️')
      .setStyle(ButtonStyle.Danger)
  );

  return new ActionRowBuilder().addComponents(...buttons);
}

function orderTicketButtons(ownerId, ticketRequest = null) {
  return new ActionRowBuilder().addComponents(
    takeTicketButton(ownerId, ticketRequest),
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
    return orderTicketButtons(ownerId, ticketRequest);
  }

  return ticketButtons(ownerId, ticketRequest, {
    includeTake: !ticketRequest?.completedAt && !ticketRequest?.archivedAt
  });
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

function clearTicketCleanup(channelId) {
  const timer = ticketCleanupTimers.get(channelId);
  if (!timer) return;

  clearTimeout(timer);
  ticketCleanupTimers.delete(channelId);
}

function clearTicketNoResponseReminder(channelId) {
  const timer = ticketNoResponseReminderTimers.get(channelId);
  if (!timer) return;

  clearTimeout(timer);
  ticketNoResponseReminderTimers.delete(channelId);
}

function scheduleArchivedTicketCleanup(channelId, archivedAt = Date.now()) {
  clearTicketCleanup(channelId);
  clearTicketNoResponseReminder(channelId);

  const deleteAt = Number(archivedAt) + ARCHIVED_TICKET_TTL;
  const delay = Math.max(deleteAt - Date.now(), 0);
  const timer = setTimeout(() => {
    deleteArchivedTicketChannel(channelId, '24h écoulées')
      .catch(error => reportCrash('Suppression auto ticket archivé impossible', error, [
        `Ticket : <#${channelId}> (${channelId})`
      ]));
  }, delay);

  ticketCleanupTimers.set(channelId, timer);
}

function scheduleCompletedOrderTicketCleanup(channelId, completedAt = Date.now()) {
  clearTicketCleanup(channelId);
  clearTicketNoResponseReminder(channelId);

  const deleteAt = Number(completedAt) + ARCHIVED_TICKET_TTL;
  const delay = Math.max(deleteAt - Date.now(), 0);
  const timer = setTimeout(() => {
    deleteCompletedOrderTicketChannel(channelId, '24h après commande terminée')
      .catch(error => reportCrash('Suppression auto commande terminée impossible', error, [
        `Ticket : <#${channelId}> (${channelId})`
      ]));
  }, delay);

  ticketCleanupTimers.set(channelId, timer);
}

function scheduleOpenTicketNoResponseReminder(channelId, reminderAt) {
  if (!reminderAt) return;
  clearTicketNoResponseReminder(channelId);

  const delay = Math.max(Number(reminderAt) - Date.now(), 0);
  const timer = setTimeout(() => {
    sendOpenTicketNoResponseReminder(channelId)
      .catch(error => reportCrash('Relance auto ticket sans réponse impossible', error, [
        `Ticket : <#${channelId}> (${channelId})`
      ]));
  }, delay);

  ticketNoResponseReminderTimers.set(channelId, timer);
}

function scheduleOpenTicketNoResponseCleanup(channelId, closeAt) {
  if (!closeAt) return;
  clearTicketCleanup(channelId);

  const delay = Math.max(Number(closeAt) - Date.now(), 0);
  const timer = setTimeout(() => {
    closeOpenTicketWithoutResponse(channelId)
      .catch(error => reportCrash('Fermeture auto ticket sans réponse impossible', error, [
        `Ticket : <#${channelId}> (${channelId})`
      ]));
  }, delay);

  ticketCleanupTimers.set(channelId, timer);
}

async function sendOpenTicketNoResponseReminder(channelId) {
  clearTicketNoResponseReminder(channelId);

  const ticketRequest = getTicketRequest(channelId);
  if (
    !ticketRequest ||
    !ticketRequest.noResponseReminderAt ||
    ticketRequest.noResponseReminderSentAt ||
    !shouldTrackNoMemberResponse(ticketRequest) ||
    ticketRequest.archivedAt ||
    ticketRequest.completedAt
  ) {
    return;
  }

  const channel = client.channels.cache.get(channelId)
    || await client.channels.fetch(channelId).catch(() => null);

  if (!channel) return;

  const closeAt = ticketRequest.noResponseCloseAt
    ? `<t:${Math.floor(ticketRequest.noResponseCloseAt / 1000)}:R>`
    : 'bientôt';
  const reminderLines = [
    `<@${ticketRequest.userId}>`,
    '',
    '⏰ **Relance automatique**',
    '',
    'Nous attendons toujours ta réponse dans ce ticket.',
    `Sans réponse de ta part, ce ticket sera fermé automatiquement ${closeAt}.`
  ];

  if (ticketRequest.type === 'recharge') {
    const user = await client.users.fetch(ticketRequest.userId).catch(() => null);
    if (user) await user.send(reminderLines.join('\n')).catch(() => {});
  }

  await channel.send(reminderLines.join('\n')).catch(() => {});

  ticketRequest.noResponseReminderSentAt = Date.now();
  delete ticketRequest.noResponseReminderAt;
  saveRequests();
}

async function closeOpenTicketWithoutResponse(channelId) {
  clearTicketCleanup(channelId);
  clearTicketNoResponseReminder(channelId);

  const ticketRequest = getTicketRequest(channelId);
  if (
    !ticketRequest ||
    !ticketRequest.noResponseCloseAt ||
    !shouldTrackNoMemberResponse(ticketRequest) ||
    ticketRequest.archivedAt ||
    ticketRequest.completedAt
  ) {
    return;
  }

  const channel = client.channels.cache.get(channelId)
    || await client.channels.fetch(channelId).catch(() => null);

  if (!channel) {
    delete requests.tickets[channelId];
    upsertTicketHistory(ticketRequest, {
      deletedAt: Date.now(),
      deletedReason: 'Salon introuvable'
    });
    saveRequests();
    return;
  }

  await archiveTicketChannel(channel, ticketRequest, client.user, ticketRequest.userId);
  await sendAdminLog('⏰ Ticket fermé automatiquement - aucune réponse', [
    `Ticket : ${logChannel(channel)}`,
    `Demande : **${ticketRequest.id}**`,
    `Type : **${ticketRequest.type}**`,
    `Client : <@${ticketRequest.userId}>`,
    'Raison : aucune réponse du membre pendant 4h après l’ouverture'
  ], 0xE67E22);
}

async function deleteArchivedTicketChannel(channelId, reason) {
  clearTicketCleanup(channelId);
  clearTicketNoResponseReminder(channelId);

  const ticketRequest = getTicketRequest(channelId);
  const channel = client.channels.cache.get(channelId)
    || await client.channels.fetch(channelId).catch(() => null);

  if (!channel) {
    if (ticketRequest?.archivedAt) {
      upsertTicketHistory(ticketRequest, {
        deletedAt: Date.now(),
        deletedReason: 'Salon introuvable'
      });
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

  upsertTicketHistory(ticketRequest, {
    deletedAt: Date.now(),
    deletedReason: reason
  });
  delete requests.tickets[channelId];
  saveRequests();
}

async function deleteCompletedOrderTicketChannel(channelId, reason) {
  clearTicketCleanup(channelId);
  clearTicketNoResponseReminder(channelId);

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
    upsertTicketHistory(ticketRequest, {
      deletedAt: Date.now(),
      deletedReason: 'Salon introuvable'
    });
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

  upsertTicketHistory(ticketRequest, {
    deletedAt: Date.now(),
    deletedReason: reason
  });
  delete requests.tickets[channelId];
  saveRequests();
}

function scheduleTicketCleanups() {
  let requestsChanged = false;

  Object.entries(requests.tickets || {}).forEach(([channelId, ticketRequest]) => {
    if (ticketRequest?.archivedAt) {
      scheduleArchivedTicketCleanup(channelId, ticketRequest.archivedAt);
      return;
    }

    if (ticketRequest?.type === 'commande' && ticketRequest.completedAt) {
      scheduleCompletedOrderTicketCleanup(channelId, ticketRequest.completedAt);
      return;
    }

    if (ensureNoMemberResponseCloseAt(ticketRequest)) requestsChanged = true;

    if (ticketRequest?.noResponseCloseAt && shouldTrackNoMemberResponse(ticketRequest)) {
      if (ticketRequest.noResponseReminderAt && !ticketRequest.noResponseReminderSentAt) {
        scheduleOpenTicketNoResponseReminder(channelId, ticketRequest.noResponseReminderAt);
      }

      scheduleOpenTicketNoResponseCleanup(channelId, ticketRequest.noResponseCloseAt);
    }
  });

  if (requestsChanged) saveRequests();
}

async function syncActiveTicketPermissions() {
  let syncedCount = 0;

  for (const [channelId, ticketRequest] of Object.entries(requests.tickets || {})) {
    if (!ticketRequest || ticketRequest.archivedAt) continue;

    const channel = client.channels.cache.get(channelId)
      || await client.channels.fetch(channelId).catch(() => null);

    if (!channel?.guild || !channel.permissionOverwrites?.set) continue;

    const ownerId = ticketRequest.userId;
    const overwrites = ticketRequest.type === 'commande' && ticketRequest.completedAt
      ? completedOrderTicketPermissionOverwrites(channel.guild, ownerId)
      : restoreTicketPermissionOverwrites(channel.guild, ticketRequest, ownerId);

    await channel.permissionOverwrites.set(overwrites)
      .then(() => { syncedCount += 1; })
      .catch(error => reportCrash('Synchronisation permissions ticket impossible', error, [
        `Ticket : <#${channelId}> (${channelId})`,
        `Demande : **${ticketRequest.id || 'inconnue'}**`,
        `Type : **${ticketRequest.type || 'inconnu'}**`
      ]));
  }

  if (syncedCount > 0) {
    await sendBotLog('🔐 Permissions tickets synchronisées', `Tickets actifs mis à jour : **${syncedCount}**`, 0x3498DB);
  }
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
    delete ticketRequest.noResponseReminderAt;
    delete ticketRequest.noResponseCloseAt;
    upsertTicketHistory(ticketRequest);
    saveRequests();
  }

  clearTicketNoResponseReminder(channel.id);
  clearTicketCleanup(channel.id);
  await channel.setParent(TICKET_ARCHIVE_CATEGORY, { lockPermissions: false });
  await channel.permissionOverwrites.set(archivedTicketPermissionOverwrites(channel.guild, ticketRequest));
  await renameTicketChannelState(channel, ticketRequest, 'archive');

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

  if (ticketRequest) {
    clearTicketCleanup(channel.id);
    clearTicketNoResponseReminder(channel.id);
    ticketRequest.reopenedAt = Date.now();
    ticketRequest.reopenedBy = user.id;
    delete ticketRequest.archivedAt;
    delete ticketRequest.archivedBy;
    if (shouldTrackNoMemberResponse(ticketRequest)) {
      ticketRequest.noResponseReminderAt = ticketRequest.reopenedAt + TICKET_NO_RESPONSE_REMINDER_DELAY;
      ticketRequest.noResponseCloseAt = ticketRequest.reopenedAt + TICKET_NO_RESPONSE_TTL;
      delete ticketRequest.noResponseReminderSentAt;
      scheduleOpenTicketNoResponseReminder(channel.id, ticketRequest.noResponseReminderAt);
      scheduleOpenTicketNoResponseCleanup(channel.id, ticketRequest.noResponseCloseAt);
    }
    upsertTicketHistory(ticketRequest);
    saveRequests();
  }

  await renameTicketChannelState(channel, ticketRequest, ticketStateForRequest(ticketRequest));

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
  await renameTicketChannelState(channel, ticketRequest, 'termine');

  if (ticketRequest) {
    ticketRequest.completedAt = Date.now();
    ticketRequest.completedBy = user.id;
    ticketRequest.completedParentId = ORDER_DONE_CATEGORY;
    ticketRequest.originalParentId = ORDER_DONE_CATEGORY;
    delete ticketRequest.noResponseCloseAt;
    delete ticketRequest.noResponseReminderAt;
    recordShopOrderCompleted(ticketRequest);
    upsertTicketHistory(ticketRequest);
    saveRequests();
    scheduleDataBackup('order_completed', user);
  }

  scheduleCompletedOrderTicketCleanup(channel.id, ticketRequest?.completedAt || Date.now());

  let dmSent = false;

  if (ticketRequest?.userId) {
    const customer = await client.users.fetch(ticketRequest.userId).catch(() => null);
    if (customer) {
      await customer.send({ embeds: [buildCompletedOrderDmEmbed(ticketRequest)] })
        .then(() => { dmSent = true; })
        .catch(() => {});
    }
  }

  await channel.send({ embeds: [buildCompletedOrderTicketEmbed(ticketRequest, dmSent)] });

  return { dmSent };
}

async function addCustomerRoleAfterCompletedOrder(guild, ticketRequest) {
  if (!ticketRequest?.userId) return false;

  const member = await guild.members.fetch(ticketRequest.userId).catch(() => null);
  if (!member) return false;

  if (member.roles.cache.has(CUSTOMER_ROLE_ID)) return true;

  await member.roles.add(CUSTOMER_ROLE_ID, 'Commande marquée terminée')
    .catch(error => {
      throw new Error(`Rôle Le Rent’a impossible à ajouter : ${error.message}`);
    });

  return true;
}

function sanitizeChannelName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 30) || 'client';
}

const TICKET_CHANNEL_STATE_PREFIXES = [
  'attente-screen',
  'attente-client',
  'a-verifier',
  'en-cours',
  'commande',
  'recharge',
  'support',
  'archive',
  'termine',
  'valide'
];

function stripTicketChannelStatePrefix(channelName) {
  let baseName = String(channelName || 'client');

  for (let index = 0; index < 10; index += 1) {
    const prefix = TICKET_CHANNEL_STATE_PREFIXES.find(state => (
      baseName === state ||
      baseName.startsWith(`${state}-`)
    ));

    if (!prefix) break;
    baseName = baseName === prefix ? 'client' : baseName.slice(prefix.length + 1);
  }

  return sanitizeChannelName(baseName);
}

function ticketChannelBaseName(channel, ticketRequest) {
  return sanitizeChannelName(ticketRequest?.channelBaseName || stripTicketChannelStatePrefix(channel?.name));
}

function buildTicketChannelName(state, baseName) {
  return `${state}-${sanitizeChannelName(baseName)}`.slice(0, 100);
}

function ticketStateForRequest(ticketRequest) {
  if (ticketRequest?.type === 'commande') return ticketRequest.completedAt ? 'termine' : 'en-cours';
  if (ticketRequest?.type === 'recharge') {
    if (ticketRequest.paidAt) return 'valide';
    if (ticketRequest.screenshotReceivedAt) return 'a-verifier';
    return 'attente-screen';
  }
  if (ticketRequest?.type === 'support') return 'attente-client';
  return 'ticket';
}

async function renameTicketChannelState(channel, ticketRequest, state) {
  if (!channel || typeof channel.setName !== 'function') return false;

  const baseName = ticketChannelBaseName(channel, ticketRequest);
  const nextName = buildTicketChannelName(state, baseName);
  if (ticketRequest) ticketRequest.channelBaseName = baseName;
  if (channel.name === nextName) return false;

  return channel.setName(nextName)
    .then(() => {
      if (ticketRequest) saveRequests();
      return true;
    })
    .catch(error => {
      reportCrash('Renommage ticket impossible', error, [
        `Salon : ${logChannel(channel)}`,
        `Nouveau nom : \`${nextName}\``,
        ticketRequest ? `Demande : **${ticketRequest.id}**` : null
      ].filter(Boolean));
      return false;
    });
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

function paymentConfigValue(method) {
  const key = method === 'virement' ? 'iban' : method;
  return String(paymentConfig[key] || DEFAULT_PAYMENT_CONFIG[key] || '').trim();
}

function paymentConfigFieldLabel(method) {
  return {
    paypal: 'PayPal',
    revolut: 'Revolut',
    iban: 'IBAN'
  }[method] || method;
}

function paymentConfigInlineValue(value) {
  return String(value || '').replace(/`/g, "'").slice(0, 1000);
}

function paymentConfigBlockValue(value) {
  return String(value || '').replace(/```/g, "'''").slice(0, 1000);
}

function setPaymentConfigValue(method, value, user) {
  if (!['paypal', 'revolut', 'iban'].includes(method)) return false;

  paymentConfig[method] = String(value || '').trim();
  paymentConfig.updatedAt = Date.now();
  paymentConfig.updatedBy = user?.id || null;
  savePaymentConfig();
  scheduleDataBackup('payment_config_updated', user);
  return true;
}

function buildPaymentConfigEmbed(guild) {
  const updated = paymentConfig.updatedAt
    ? `<t:${Math.floor(paymentConfig.updatedAt / 1000)}:R>`
    : 'jamais modifié depuis Discord';
  const updatedBy = paymentConfig.updatedBy ? `<@${paymentConfig.updatedBy}>` : 'Non précisé';

  return new EmbedBuilder()
    .setColor(0x3498DB)
    .setAuthor({ name: 'Configuration paiements', iconURL: guild.iconURL({ dynamic: true }) })
    .setTitle('Moyens de paiement configurés')
    .setDescription([
      'Modifie les moyens de paiement utilisés dans les MP de recharge.',
      '',
      `Dernière modification : **${updated}**`,
      `Par : ${updatedBy}`
    ].join('\n'))
    .addFields(
      { name: 'PayPal', value: `\`${paymentConfigInlineValue(paymentConfigValue('paypal'))}\``, inline: false },
      { name: 'Revolut', value: `\`${paymentConfigInlineValue(paymentConfigValue('revolut'))}\``, inline: false },
      { name: 'IBAN', value: `\`\`\`text\n${paymentConfigBlockValue(paymentConfigValue('virement'))}\n\`\`\``, inline: false }
    )
    .setFooter({ text: 'La Rent’a • Paiements configurables' })
    .setTimestamp();
}

function paymentConfigButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('edit_payment_config:paypal')
      .setLabel('Modifier PayPal')
      .setEmoji('🅿️')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('edit_payment_config:revolut')
      .setLabel('Modifier Revolut')
      .setEmoji('💳')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('edit_payment_config:iban')
      .setLabel('Modifier IBAN')
      .setEmoji('🏦')
      .setStyle(ButtonStyle.Primary)
  );
}

function paymentInstruction(method) {
  if (method === 'paypal') {
    return `ENVOIE ICI EN AMI PROCHE & SANS NOTES : ${paymentConfigValue('paypal')} | Puis réponds à ce message en joignant ton screenshot PayPal (capture d'écran du paiement).`;
  }

  if (method === 'revolut') {
    return `ENVOIE ICI SANS NOTES : ${paymentConfigValue('revolut')} | Puis réponds à ce message en joignant ton screenshot Revolut (capture d'écran du paiement).`;
  }

  if (method === 'virement') {
    return `EFFECTUE LE VIREMENT SANS NOTES : IBAN ${paymentConfigValue('virement')} | Puis réponds à ce message en joignant ton screenshot du virement.`;
  }

  return 'Puis réponds à ce message en joignant ton screenshot du paiement.';
}

function rechargeInstructionMessage(request) {
  const methodName = paymentLabel(request.method);

  if (request.method === 'virement') {
    return [
      `🧭 **Recharge ${methodName} — Étape 2/2**`,
      '',
      `Montant déclaré : **${request.amount}** | Demande n°**${request.id}**`,
      `Date indiquée : **${request.paymentDate || 'Non précisée'}** | Heure : **${request.paymentTime || 'Non précisée'}**`,
      '',
      '🏦 **Copie l’IBAN ci-dessous :**',
      '```text',
      paymentConfigValue('virement'),
      '```',
      '',
      '⚠️ **Ne mets aucune note / aucun libellé dans le virement.**',
      '',
      'Puis réponds à ce message en joignant ton screenshot du virement.',
      '⏳ Tu as **24h** pour l\'envoyer.'
    ].join('\n');
  }

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

async function deleteCommandMessage(message) {
  if (!message?.guild || !message.content?.startsWith('!')) return true;

  let botMember = message.guild.members.me;
  if (!botMember && client.user?.id) {
    botMember = await message.guild.members.fetch(client.user.id).catch(() => null);
  }

  const permissions = botMember && typeof message.channel.permissionsFor === 'function'
    ? message.channel.permissionsFor(botMember)
    : null;
  const canManageMessages = Boolean(permissions?.has(PermissionFlagsBits.ManageMessages));

  if (!message.deletable && !canManageMessages) {
    await sendAdminLog('⚠️ Commande admin non supprimée', [
      `Admin : ${logUser(message.author)}`,
      `Salon : ${logChannel(message.channel)}`,
      `Commande : \`${message.content.slice(0, 1000)}\``,
      'Raison : le bot n’a pas la permission **Gérer les messages** dans ce salon.'
    ], 0xF1C40F);
    return false;
  }

  return message.delete()
    .then(() => true)
    .catch(async error => {
      await sendAdminLog('⚠️ Commande admin non supprimée', [
        `Admin : ${logUser(message.author)}`,
        `Salon : ${logChannel(message.channel)}`,
        `Commande : \`${message.content.slice(0, 1000)}\``,
        `Erreur : **${error.message}**`,
        'Permission requise : **Gérer les messages**.'
      ], 0xF1C40F);
      return false;
    });
}

async function replyTemp(interaction, options, delay = DELETE_DELAY) {
  if (interaction.replied || interaction.deferred) {
    const reply = await interaction.followUp({ ...options, fetchReply: true });
    setTimeout(() => {
      reply.delete().catch(() => {});
    }, delay);
    return reply;
  }

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

      return `💰  ${label.padEnd(15, ' ')} →   ${formatProductPrice(product.value)}`;
    })
    .join('\n\n');
}

async function handleProductOrder(interaction, productId) {
  if (isMaintenanceEnabledFor(interaction.member)) {
    return replyMaintenance(interaction);
  }

  const uid = interaction.user.id;
  if (!wallets[uid]) wallets[uid] = { balance: 0 };

  const product = getProduct(productId);
  const prix = getProductPrice(productId);

  if (!product || prix === undefined) {
    return replyTemp(interaction, { content: '❌ Produit introuvable.', ephemeral: true });
  }

  if (!isProductAvailable(productId)) {
    sendActionLog(interaction.member, '📦 Commande refusée - produit indisponible', [
      `Client : ${logUser(interaction.user)}`,
      `Produit : **${product.label}**`
    ], 0xF1C40F);

    return replyTemp(interaction, {
      embeds: [
        new EmbedBuilder()
          .setColor(0xE74C3C)
          .setTitle('❌ Produit indisponible')
          .setDescription([
            `Produit : **${product.label}**`,
            '',
            'Ce produit est actuellement indisponible.',
            'Reviens plus tard ou choisis un autre produit.'
          ].join('\n'))
      ],
      ephemeral: true
    }, 60_000);
  }

  if (wallets[uid].balance < prix) {
    const currentBalance = wallets[uid].balance;
    const missingAmount = Math.max(prix - currentBalance, 0);

    sendActionLog(interaction.member, '⚠️ Commande refusée - solde insuffisant', [
      `Client : ${logUser(interaction.user)}`,
      `Produit : **${product.label}**`,
      `Prix : **${formatWalletAmount(prix)}**`,
      `Solde : **${formatWalletAmount(currentBalance)}**`,
      `Manque : **${formatWalletAmount(missingAmount)}**`
    ], 0xF1C40F);

    const rechargeRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('recharger')
        .setLabel('Recharger mon solde')
        .setEmoji('➕')
        .setStyle(ButtonStyle.Primary)
    );

    const insufficientBalanceEmbed = new EmbedBuilder()
      .setColor(0xE74C3C)
      .setTitle('❌ Solde insuffisant')
      .setDescription([
        `Produit : **${product.label}**`,
        `Prix : **${formatWalletAmount(prix)}**`,
        `Ton solde : **${formatWalletAmount(currentBalance)}**`,
        `Il te manque : **${formatWalletAmount(missingAmount)}**`,
        '',
        'Recharge ton portefeuille pour finaliser ta commande.'
      ].join('\n'));

    return replyTemp(interaction, {
      embeds: [insufficientBalanceEmbed],
      components: [rechargeRow],
      ephemeral: true
    }, 120_000);
  }

  const ticketConfirmation = await confirmOpeningAnotherTicket(interaction, 'commande');
  if (!ticketConfirmation.confirmed) return;
  const responseInteraction = ticketConfirmation.interaction;

  wallets[uid].balance -= prix;
  saveWallets();
  const channelBaseName = sanitizeChannelName(interaction.user.username);

  const ticket = await interaction.guild.channels.create({
    name: buildTicketChannelName('en-cours', channelBaseName),
    parent: ORDER_CATEGORY,
    type: ChannelType.GuildText,
    permissionOverwrites: ticketPermissionOverwrites(interaction.guild, interaction.user.id)
  });

  const request = createRequest('commande', ticket.id, interaction.user.id, {
    channelBaseName,
    product: product.label,
    price: prix
  });
  recordWalletHistory(uid, {
    type: 'order',
    amountCents: -eurosToCents(prix),
    balanceAfterCents: eurosToCents(wallets[uid].balance),
    actorId: interaction.user.id,
    ticketRequestId: request.id,
    product: product.label
  });
  recordShopOrderCreated(product.label, prix);
  scheduleDataBackup('order_created', interaction.user);

  await ticket.send({
    content: `<@&${STAFF_ROLE_ID}>

🎫 **Nouvelle commande à traiter**

🧾 Demande : #${request.id}
👤 Client : <@${interaction.user.id}>
📦 Produit : ${product.label}
💰 Payé : ${prix}€

📌 Envoyer le produit au client.

━━━━━━━━━━━━━━

✅ **Commande prise en compte**

Votre demande a bien été enregistrée.
Un owner a été informé et va prendre en charge votre commande.

⏱️ Délai estimé : **5 à 15 minutes**

Merci de rester disponible dans ce ticket.
Le staff vous répondra dès que possible.`,
    components: [orderTicketButtons(interaction.user.id, request)]
  });

  sendAdminLog('🎫 Commande créée', [
    `Client : ${logUser(interaction.user)}`,
    `Demande : **${request.id}**`,
    `Produit : **${product.label}**`,
    `Prix payé : **${prix}€**`,
    `Nouveau solde : **${wallets[uid].balance.toFixed(2)}€**`,
    `Ticket : ${logChannel(ticket)}`
  ], 0x2ECC71);

  return replyTemp(responseInteraction, {
    content: `✅ Commande envoyée au staff.\n🧾 Demande : #${request.id}`,
    ephemeral: true
  });
}

function buildAvisEmbed() {
  return new EmbedBuilder()
    .setColor(0xD4AF37)
    .setTitle('Merci pour ta commande')
    .setDescription([
      'Ta commande est terminée, merci pour ta confiance !',
      '',
      `N’hésite pas à laisser un avis ici : <#${AVIS_CHANNEL_ID}>`,
      'Et si tu as apprécié le service, parle-en autour de toi !',
      '',
      'Bon appétit 😋'
    ].join('\n'))
    .setFooter({ text: 'Boutique' });
}

function helpCommandLines(entries) {
  return entries.map(([command, description]) => `**${command}** : ${description}`).join('\n');
}

function buildHelpEmbed(guild) {
  return new EmbedBuilder()
    .setColor(0xD4AF37)
    .setAuthor({ name: 'La Rent’a', iconURL: guild.iconURL({ dynamic: true }) })
    .setTitle('Commandes du serveur')
    .setDescription([
      'Les commandes ci-dessous sont à taper avec `!` devant.',
      'Elles sont listées ici sans le `!` comme demandé.',
      '',
      'Les membres ne peuvent pas utiliser les commandes. Les menus envoyés par les admins restent visibles par les membres.'
    ].join('\n'))
    .addFields(
      {
        name: 'Menus visibles par les membres',
        value: helpCommandLines([
          ['support', 'affiche le panneau support public.'],
          ['guide', 'affiche le guide public pour recharger et commander.'],
          ['regles', 'affiche le règlement public avec le bouton d’acceptation.'],
          ['tarifs', 'affiche la grille publique des prix McDonald’s.'],
          ['mdp', 'affiche le panneau public des moyens de paiement.'],
          ['parrainage', 'affiche le panneau public parrainage et ses boutons.'],
          ['avis', 'affiche le message public pour laisser un avis.']
        ]),
        inline: false
      },
      {
        name: 'Admin / staff',
        value: helpCommandLines([
          ['help', 'affiche cette liste de commandes.'],
          ['setup', 'envoie le message principal de la boutique.'],
          ['clear', 'nettoie le salon où la commande est utilisée.'],
          ['warnings @membre', 'affiche les warns d’un membre.'],
          ['warn @membre raison', 'ajoute un warn manuel.'],
          ['unwarn @membre [nombre]', 'retire les derniers warns.'],
          ['clearwarns @membre', 'supprime tous les warns du membre.'],
          ['wallet @membre', 'affiche le solde d’un membre.'],
          ['invites @membre', 'affiche les infos parrainage d’un membre.'],
          ['topinvites', 'affiche le classement parrainage.']
        ]),
        inline: false
      },
      {
        name: 'Owner',
        value: helpCommandLines([
          ['prix', 'modifie les tarifs via boutons et formulaire.'],
          ['stock', 'affiche les produits en boutons pour les rendre disponibles ou indisponibles.'],
          ['reduc nombre', 'applique une réduction globale à la boutique.'],
          ['resetreduc', 'retire la réduction globale.'],
          ['stats', 'affiche les statistiques boutique.'],
          ['maintenance on/off/status', 'active, désactive ou consulte la maintenance.'],
          ['autodispo on/off/status', 'active, coupe ou consulte les messages automatiques de 11h et 18h.'],
          ['annonce', 'ouvre un formulaire pour envoyer une annonce dans le salon des disponibilités.'],
          ['paiements', 'modifie PayPal, Revolut et IBAN depuis Discord.'],
          ['backup', 'crée une sauvegarde manuelle des données importantes du bot.'],
          ['history @membre', 'affiche l’historique portefeuille.'],
          ['tickets @membre', 'affiche l’historique tickets.'],
          ['refund', 'rembourse une commande depuis son ticket.'],
          ['add @membre montant', 'ajoute du solde à un membre.'],
          ['remove @membre montant', 'retire du solde à un membre.']
        ]),
        inline: false
      }
    )
    .setFooter({ text: 'La Rent’a • Aide commandes' });
}

function buildGuideFaqEmbed(guild) {
  return new EmbedBuilder()
    .setColor(0x3498DB)
    .setAuthor({ name: 'FAQ boutique', iconURL: guild.iconURL({ dynamic: true }) })
    .setTitle('Questions fréquentes')
    .setDescription([
      '**Où commander ?**',
      `Tout se passe dans <#${SHOP_CHANNEL_ID}> avec le bouton **Commander ${MCDONALDS_EMOJI}**.`,
      '',
      '**Comment recharger ?**',
      'Clique sur **Recharger le solde**, indique le montant/date/heure, puis choisis PayPal, Revolut ou virement.',
      '',
      '**Où envoyer le screenshot ?**',
      'Le bot t’envoie un message privé. Réponds directement au bot en MP avec ton screenshot de paiement.',
      '',
      '**Je ne vois pas le MP du bot, je fais quoi ?**',
      'Vérifie tes messages privés Discord et tes demandes de message. Si tu ne trouves rien, ouvre un ticket support.',
      '',
      '**Quand mon solde est ajouté ?**',
      'Un owner vérifie ta preuve. Si le paiement est bien reçu, ton portefeuille est crédité automatiquement.',
      '',
      '**Pourquoi je dois garder le ticket ouvert ?**',
      'Le ticket sert au suivi de ta commande ou recharge. Ne le ferme pas tant que tout n’est pas terminé.',
      '',
      '**Besoin d’aide ?**',
      `Ouvre un ticket support dans <#${SUPPORT_CHANNEL_ID}>.`
    ].join('\n'))
    .setFooter({ text: 'La Rent’a • FAQ rapide' });
}

function announcementTypeConfig(type) {
  const normalized = String(type || 'info').trim().toLowerCase();

  if (['promo', 'promotion', 'reduc', 'réduc', 'reduction', 'réduction'].includes(normalized)) {
    return { key: 'promo', label: 'Promo', emoji: '🏷️', color: 0xD4AF37 };
  }

  if (['important', 'urgence', 'urgent', 'alerte'].includes(normalized)) {
    return { key: 'important', label: 'Important', emoji: '⚠️', color: 0xE74C3C };
  }

  return { key: 'info', label: 'Info', emoji: '📣', color: 0x3498DB };
}

function buildAnnouncementEmbed(title, body, type) {
  const config = announcementTypeConfig(type);

  return new EmbedBuilder()
    .setColor(config.color)
    .setTitle(`${config.emoji} ${title}`.slice(0, 256))
    .setDescription(body.slice(0, 4096))
    .setFooter({ text: `La Rent’a • Annonce ${config.label}` })
    .setTimestamp();
}

function buildCompletedOrderTicketEmbed(ticketRequest, dmSent) {
  return new EmbedBuilder()
    .setColor(0x2ECC71)
    .setTitle('✅ Commande terminée')
    .setDescription([
      'La commande a été marquée comme livrée par un owner.',
      '',
      `🧾 Demande : #${ticketRequest?.id || 'Non précisée'}`,
      `👤 Client : ${ticketRequest?.userId ? `<@${ticketRequest.userId}>` : 'Non précisé'}`,
      `📦 Produit : ${ticketRequest?.product || 'Non précisé'}`,
      '',
      dmSent
        ? '📩 Le client a été prévenu en message privé.'
        : '⚠️ Impossible d’envoyer un MP au client.',
      'Merci de conserver les informations de livraison dans ce ticket.',
      '',
      '⭐ **Avis**',
      '',
      'Ta commande est terminée, merci pour ta confiance !',
      '',
      `N’hésite pas à laisser un avis ici : <#${AVIS_CHANNEL_ID}>`,
      'Et si tu as apprécié le service, parle-en autour de toi !',
      '',
      'Bon appétit 😋',
      '',
      '🕒 Ce ticket commande sera supprimé automatiquement dans 24h.'
    ].join('\n'))
    .setFooter({ text: 'Boutique' })
    .setTimestamp();
}

function buildCompletedOrderDmEmbed(ticketRequest) {
  return new EmbedBuilder()
    .setColor(0x2ECC71)
    .setTitle('✅ Commande livrée')
    .setDescription([
      'Ta commande a été marquée comme terminée.',
      '',
      `🧾 Demande : #${ticketRequest?.id || 'Non précisée'}`,
      '',
      'Merci pour ta confiance !',
      `Tu peux laisser un avis ici : <#${AVIS_CHANNEL_ID}>.`
    ].join('\n'))
    .setFooter({ text: 'Boutique' })
    .setTimestamp();
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

const availabilityFormatter = new Intl.DateTimeFormat('fr-FR', {
  timeZone: AVAILABILITY_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23'
});

const AVAILABILITY_SLOTS = {
  morning: {
    key: 'morning',
    hour: 11,
    title: 'La Rent’a est disponible toute la journée',
    lines: [
      'Nous sommes dispo pour prendre vos commandes aujourd’hui.',
      'Pensez à vérifier votre portefeuille avant de commander.'
    ]
  },
  evening: {
    key: 'evening',
    hour: 18,
    title: 'La Rent’a est disponible toute la soirée',
    lines: [
      'Nous sommes dispo pour prendre vos commandes ce soir.',
      'Rechargez votre solde si besoin, puis passez commande depuis la boutique.'
    ]
  }
};

function getParisDateTimeParts(date = new Date()) {
  const parts = Object.fromEntries(
    availabilityFormatter.formatToParts(date)
      .filter(part => part.type !== 'literal')
      .map(part => [part.type, part.value])
  );

  return {
    dateKey: `${parts.year}-${parts.month}-${parts.day}`,
    hour: Number(parts.hour),
    minute: Number(parts.minute)
  };
}

function buildAvailabilityMessage(slot) {
  return [
    '@everyone',
    '',
    `${MCDONALDS_EMOJI} **${slot.title}**`,
    '',
    ...slot.lines,
    '',
    `📍 Pour commander : <#${SHOP_CHANNEL_ID}>`
  ].join('\n');
}

async function deletePreviousAvailabilityMessage(channel) {
  if (!availabilityState.lastMessageId) return;

  const previousMessage = await channel.messages.fetch(availabilityState.lastMessageId).catch(() => null);
  if (!previousMessage) return;

  await previousMessage.delete().catch(error => sendAdminLog('⚠️ Message disponibilité non supprimé', [
    `Salon : ${logChannel(channel)}`,
    `Message : **${availabilityState.lastMessageId}**`,
    `Erreur : **${error.message}**`
  ], 0xF1C40F));
}

async function deleteStoredAvailabilityMessage() {
  const channel = client.channels.cache.get(AVAILABILITY_CHANNEL_ID)
    || await client.channels.fetch(AVAILABILITY_CHANNEL_ID).catch(() => null);

  if (channel && typeof channel.send === 'function') {
    await deletePreviousAvailabilityMessage(channel);
  }

  availabilityState.lastMessageId = null;
  availabilityState.lastSlot = null;
  saveAvailabilityState();
}

async function sendAvailabilityMessage(slotKey, dateKey) {
  const slot = AVAILABILITY_SLOTS[slotKey];
  if (!slot) return;

  const channel = client.channels.cache.get(AVAILABILITY_CHANNEL_ID)
    || await client.channels.fetch(AVAILABILITY_CHANNEL_ID).catch(() => null);

  if (!channel || typeof channel.send !== 'function') {
    await sendAdminLog('⚠️ Message disponibilité impossible', [
      `Salon introuvable : <#${AVAILABILITY_CHANNEL_ID}>`,
      `Créneau : **${slotKey}**`
    ], 0xF1C40F);
    return;
  }

  const previousMessageId = availabilityState.lastMessageId;
  await deletePreviousAvailabilityMessage(channel);

  const sentMessage = await channel.send({
    content: buildAvailabilityMessage(slot),
    allowedMentions: { parse: ['everyone'] }
  })
    .catch(async error => {
      await reportCrash('Message disponibilité impossible', error, [
        `Salon : ${logChannel(channel)}`,
        `Créneau : **${slotKey}**`
      ]);
      return null;
    });

  if (!sentMessage) return;

  availabilityState.lastMessageId = sentMessage.id;
  availabilityState.lastSlot = slotKey;
  availabilityState.sentDates[slotKey] = dateKey;
  saveAvailabilityState();

  await sendAdminLog('📣 Message disponibilité envoyé', [
    `Salon : ${logChannel(channel)}`,
    `Créneau : **${slotKey === 'morning' ? '11h' : '18h'}**`,
    `Message précédent : ${previousMessageId ? 'supprimé si présent' : 'aucun'}`
  ], 0x2ECC71);
}

async function checkAvailabilitySchedule() {
  if (!availabilityState.enabled) return;

  const now = getParisDateTimeParts();
  const slot = Object.values(AVAILABILITY_SLOTS)
    .find(item => item.hour === now.hour && now.minute === 0);

  if (!slot) return;
  if (availabilityState.sentDates[slot.key] === now.dateKey) return;

  await sendAvailabilityMessage(slot.key, now.dateKey);
}

function startAvailabilityScheduler() {
  if (availabilitySchedulerTimer) clearInterval(availabilitySchedulerTimer);

  checkAvailabilitySchedule().catch(error => reportCrash('Scheduler disponibilité impossible', error));
  availabilitySchedulerTimer = setInterval(() => {
    checkAvailabilitySchedule().catch(error => reportCrash('Scheduler disponibilité impossible', error));
  }, AVAILABILITY_CHECK_INTERVAL);
}

async function announceBotChangelog() {
  if (!BOT_CHANGELOG_ITEMS.length) return;

  const channel = client.channels.cache.get(ADMIN_CHANGELOG_CHANNEL_ID)
    || await client.channels.fetch(ADMIN_CHANGELOG_CHANNEL_ID).catch(() => null);

  if (!channel || typeof channel.send !== 'function') {
    await sendBotLog('⚠️ Changelog admin impossible', [
      `Salon introuvable : <#${ADMIN_CHANGELOG_CHANNEL_ID}>`,
      `Version : **${BOT_CHANGELOG_VERSION}**`
    ], 0xF1C40F);
    return;
  }

  const description = BOT_CHANGELOG_ITEMS
    .map(item => `• ${item}`)
    .join('\n');

  await channel.send({
    embeds: [
      new EmbedBuilder()
        .setColor(0xD4AF37)
        .setTitle('🛠️ Modifications appliquées au bot')
        .setDescription(description)
        .setTimestamp()
    ]
  });

  botChangelogState.lastRestartAnnouncement = {
    version: BOT_CHANGELOG_VERSION,
    announcedAt: Date.now(),
    items: BOT_CHANGELOG_ITEMS
  };
  saveBotChangelogState();
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

  return false;
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
    await syncReferralExclusions();
    await syncActiveTicketPermissions();
    scheduleTicketCleanups();
    startAvailabilityScheduler();
    await announceBotChangelog();
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

client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
  try {
    if (isReferralExcludedMember(oldMember) || !isReferralExcludedMember(newMember)) return;

    await excludeReferralsForStaffOrOwner(newMember);
  } catch (error) {
    await reportCrash('Erreur exclusion parrainage staff/owner', error, [
      `Membre : ${newMember?.user ? logUser(newMember.user) : 'Inconnu'}`
    ]);
  }
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

    const inviterDmSent = await notifyInviterOfPendingReferral(member, referral);

    await Promise.all([
      sendInviteJoinAnnouncement(member, referral),
      sendInviteAdminAnnouncement(member, referral)
    ]);

    if (isReferralCountable(referral) && !inviterDmSent) {
      await sendAdminLog('⚠️ MP parrain impossible', [
        `Parrain : <@${referral.inviterId}>`,
        `Filleul : ${logUser(member.user)}`,
        'Raison : MP fermé ou utilisateur introuvable'
      ], 0xF1C40F);
    }
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

  if (message.guild) {
    const ticketRequest = getTicketRequest(message.channel.id);
    if (ticketRequest) markTicketResponse(ticketRequest, message.author.id);
  }

  if (!message.guild) {
    const dmRequest = findOpenRechargeRequestByUser(message.author.id);

    if (!dmRequest) return;

    if (message.attachments.size === 0) {
      return message.channel.send('📸 Envoie ici le screenshot de ton paiement pour ta recharge en cours.');
    }

    const screenshotUrl = message.attachments.first()?.url || null;
    dmRequest.screenshotReceivedAt = Date.now();
    dmRequest.screenshotUrl = screenshotUrl;
    markTicketResponse(dmRequest, message.author.id);
    saveRequests();
    upsertTicketHistory(dmRequest);

    const adminChannel = await client.channels.fetch(dmRequest.channelId).catch(() => null);

    if (adminChannel) {
      await renameTicketChannelState(adminChannel, dmRequest, 'a-verifier');

      const proofMessage = await adminChannel.send({
        embeds: [buildRechargeProofReviewEmbed(dmRequest, screenshotUrl)],
        components: [rechargeProofReviewButtons(dmRequest.id)]
      });

      dmRequest.proofPanelMessageId = proofMessage.id;
      saveRequests();
      upsertTicketHistory(dmRequest);
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
    await deleteCommandMessage(message);

    if (!isAdminMember(message.member)) {
      await sendActionLog(message.member, '⛔ Commande refusée', [
        `Utilisateur : ${logUser(message.author)}`,
        `Salon : ${logChannel(message.channel)}`,
        `Commande : \`${message.content.slice(0, 1000)}\``
      ], 0xE74C3C);

      return;
    }

    await sendAdminCommandLog('🛠️ Commande admin utilisée', [
      `Admin : ${logUser(message.author)}`,
      `Salon : ${logChannel(message.channel)}`,
      `Commande : \`${message.content.slice(0, 1000)}\``
    ], 0x95A5A6);
  }

  if (message.content === '!help') {
    return message.channel.send({ embeds: [buildHelpEmbed(message.guild)] });
  }

  if (message.content === '!backup') {
    if (!isOwnerMember(message.member)) {
      const reply = await message.channel.send('❌ Seul le rôle owner peut créer une sauvegarde manuelle.');
      return deleteLater(reply);
    }

    const backup = createDataBackup('manual_owner_backup', message.author);

    if (!backup) {
      const reply = await message.channel.send('❌ Impossible de créer la sauvegarde. Regarde les logs du bot.');
      return deleteLater(reply);
    }

    await sendAdminLog('💾 Sauvegarde manuelle créée', [
      `Owner : ${logUser(message.author)}`,
      `Salon : ${logChannel(message.channel)}`,
      `Fichier : \`${backup.filePath}\``,
      `Fichiers inclus : **${backup.fileCount}**`
    ], 0x3498DB);

    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0x3498DB)
          .setTitle('💾 Sauvegarde créée')
          .setDescription([
            `Fichier : \`${backup.filePath}\``,
            `Fichiers inclus : **${backup.fileCount}**`,
            '',
            `Le bot garde les **${DATA_BACKUP_LIMIT}** dernières sauvegardes globales.`
          ].join('\n'))
          .setTimestamp()
      ]
    });
  }

  if (message.content === '!paiements') {
    if (!isOwnerMember(message.member)) {
      const reply = await message.channel.send('❌ Seul le rôle owner peut modifier les moyens de paiement.');
      return deleteLater(reply);
    }

    await sendAdminLog('💳 Configuration paiements ouverte', [
      `Owner : ${logUser(message.author)}`,
      `Salon : ${logChannel(message.channel)}`
    ], 0x3498DB);

    return message.channel.send({
      embeds: [buildPaymentConfigEmbed(message.guild)],
      components: [paymentConfigButtons()]
    });
  }

  if (message.content === '!setup') {
    const embed = new EmbedBuilder()
      .setColor(0xD4AF37)
      .setAuthor({ name: 'La Rent’a', iconURL: message.guild.iconURL({ dynamic: true }) })
      .setTitle(`La Rent'a - Boutique McDonald's ${MCDONALDS_EMOJI}`)
      .setDescription([
        '**Bienvenue sur la boutique officielle.**',
        '',
        'Gère ton portefeuille, recharge ton solde, puis choisis ton produit McDonald’s en quelques clics.',
        '',
        '👛 **Portefeuille** — consulte ton solde actuel.',
        '💳 **Recharger** — ajoute du solde via PayPal, Revolut ou virement.',
        `${MCDONALDS_EMOJI} **Commander** — ouvre la sélection des produits disponibles.`,
        '🎁 **Fidélité Mcdo** — affiche les infos du programme fidélité.',
        '',
        'Clique sur **Commander** pour voir les produits et leurs prix.',
        'Le montant sera retiré automatiquement de ton portefeuille.',
        '',
        '👇 Sélectionne une action ci-dessous.'
      ].join('\n'))
      .setThumbnail(message.guild.iconURL({ dynamic: true }))
      .setFooter({ text: 'La Rent’a • Portefeuille • Recharge • Commande' });

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

    const guideRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('guide_faq')
        .setLabel('FAQ')
        .setEmoji('❓')
        .setStyle(ButtonStyle.Secondary)
    );

    return message.channel.send({ embeds: [guideEmbed], components: [guideRow] });
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

  if (message.content === '!prix') {
    if (!isOwnerMember(message.member)) {
      const reply = await message.channel.send('❌ Seul le rôle owner peut modifier les prix.');
      return deleteLater(reply);
    }

    const embed = new EmbedBuilder()
      .setColor(0xD4AF37)
      .setAuthor({ name: 'Tarifs McDonald\'s', iconURL: message.guild.iconURL({ dynamic: true }) })
      .setTitle(`Modifier les prix ${MCDONALDS_EMOJI}`)
      .setDescription([
        'Choisis le produit à modifier.',
        '',
        'Un formulaire va s’ouvrir pour entrer le nouveau prix.',
        '',
        'Les nouveaux prix sont appliqués immédiatement aux prochaines commandes.'
      ].join('\n'))
      .setFooter({ text: 'Owner • Modification des tarifs' });

    await sendAdminLog('💰 Panneau prix ouvert', [
      `Owner : ${logUser(message.author)}`,
      `Salon : ${logChannel(message.channel)}`
    ], 0x3498DB);

    return message.channel.send({ embeds: [embed], components: buildPriceEditorRows() });
  }

  if (message.content === '!stock') {
    if (!isOwnerMember(message.member)) {
      const reply = await message.channel.send('❌ Seul le rôle owner peut gérer le stock.');
      return deleteLater(reply);
    }

    await sendAdminLog('📦 Panneau stock ouvert', [
      `Owner : ${logUser(message.author)}`,
      `Salon : ${logChannel(message.channel)}`,
      `Indisponibles : **${products.filter(product => !isProductAvailable(product.value)).length}/${products.length}**`
    ], 0x3498DB);

    return message.channel.send({ embeds: [buildStockEditorEmbed(message.guild)], components: buildStockEditorRows() });
  }

  if (message.content === '!annonce') {
    if (!isOwnerMember(message.member)) {
      const reply = await message.channel.send('❌ Seul le rôle owner peut créer une annonce.');
      return deleteLater(reply);
    }

    const embed = new EmbedBuilder()
      .setColor(0xD4AF37)
      .setAuthor({ name: 'Annonce La Rent’a', iconURL: message.guild.iconURL({ dynamic: true }) })
      .setTitle('Créer une annonce')
      .setDescription([
        `L’annonce sera envoyée dans <#${AVAILABILITY_CHANNEL_ID}>.`,
        '',
        'Clique sur le bouton ci-dessous pour remplir le formulaire.',
        '',
        'Types acceptés : `info`, `promo`, `important`.'
      ].join('\n'))
      .setFooter({ text: 'Owner • Ce panneau disparaît dans 5 minutes' });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`open_announcement_modal:${message.author.id}`)
        .setLabel('Créer l’annonce')
        .setEmoji('📣')
        .setStyle(ButtonStyle.Primary)
    );

    await sendAdminLog('📣 Panneau annonce ouvert', [
      `Owner : ${logUser(message.author)}`,
      `Salon commande : ${logChannel(message.channel)}`,
      `Salon annonce : <#${AVAILABILITY_CHANNEL_ID}>`
    ], 0x3498DB);

    const panel = await message.channel.send({ embeds: [embed], components: [row] });
    deleteLater(panel, 5 * 60_000);
    return;
  }

  if (message.content.trim().split(/\s+/)[0] === '!reduc') {
    if (!isOwnerMember(message.member)) {
      const reply = await message.channel.send('❌ Seul le rôle owner peut appliquer une réduction.');
      return deleteLater(reply);
    }

    const args = message.content.trim().split(/\s+/);
    const percent = parseDiscountPercent(args[1]);

    if (!Number.isFinite(percent) || percent <= 0 || percent > 100) {
      const reply = await message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(0xE74C3C)
            .setTitle('❌ Réduction invalide')
            .setDescription([
              'Utilisation : `!reduc 20` ou `!reduc -20%`',
              '',
              'Tu peux mettre n’importe quel nombre entre **0.01** et **100**.'
            ].join('\n'))
        ]
      });

      return deleteLater(reply);
    }

    setGlobalDiscount(percent, message.author);

    await sendAdminLog('🏷️ Réduction boutique appliquée', [
      `Owner : ${logUser(message.author)}`,
      `Réduction : **-${formatDiscountPercent()}%**`,
      `Salon : ${logChannel(message.channel)}`
    ], 0x2ECC71);

    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0x2ECC71)
          .setTitle('🏷️ Réduction appliquée')
          .setDescription([
            `Réduction active : **-${formatDiscountPercent()}%**`,
            '',
            'Elle s’applique à toute la boutique, sur les prix actuels.',
            'Utilise `!resetreduc` pour retirer la réduction.'
          ].join('\n'))
      ]
    });
  }

  if (message.content.trim() === '!resetreduc') {
    if (!isOwnerMember(message.member)) {
      const reply = await message.channel.send('❌ Seul le rôle owner peut retirer une réduction.');
      return deleteLater(reply);
    }

    const previousDiscount = getDiscountPercent();
    const previousDiscountText = previousDiscount ? `-${formatPercentValue(previousDiscount)}%` : 'aucune';
    resetGlobalDiscount(message.author);

    await sendAdminLog('🏷️ Réduction boutique retirée', [
      `Owner : ${logUser(message.author)}`,
      `Ancienne réduction : **${previousDiscountText}**`,
      `Salon : ${logChannel(message.channel)}`
    ], 0x2ECC71);

    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0x2ECC71)
          .setTitle('✅ Réduction retirée')
          .setDescription([
            'La boutique utilise de nouveau les prix de base.',
            '',
            'Les prix modifiés avec `!prix` sont conservés.'
          ].join('\n'))
      ]
    });
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
        'Utilise les boutons ci-dessous pour récupérer ton lien ou consulter tes filleuls. 🔗'
      ].join('\n'))
      .setThumbnail(message.guild.iconURL({ dynamic: true }))
      .setFooter({ text: 'Parrainage • Invitations • Récompenses' });

    const referralRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('get_referral_invite')
        .setLabel('Obtenir mon lien')
        .setEmoji('🔗')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('get_referral_stats')
        .setLabel('Mes filleuls')
        .setEmoji('👥')
        .setStyle(ButtonStyle.Secondary)
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

  if (message.content.trim() === '!stats') {
    if (!isOwnerMember(message.member)) {
      const reply = await message.channel.send('❌ Seul le rôle owner peut consulter les stats boutique.');
      return deleteLater(reply);
    }

    await sendAdminLog('📊 Stats boutique consultées', [
      `Owner : ${logUser(message.author)}`,
      `Salon : ${logChannel(message.channel)}`
    ], 0x3498DB);

    return message.channel.send({ embeds: [buildShopStatsEmbed()] });
  }

  if (message.content.trim().split(/\s+/)[0] === '!autodispo') {
    if (!isOwnerMember(message.member)) {
      const reply = await message.channel.send('❌ Seul le rôle owner peut gérer les messages automatiques de disponibilité.');
      return deleteLater(reply);
    }

    const args = message.content.trim().split(/\s+/);
    const action = (args[1] || 'status').toLowerCase();

    if (!['on', 'off', 'status'].includes(action)) {
      const reply = await message.channel.send('Utilisation : `!autodispo on`, `!autodispo off` ou `!autodispo status`');
      return deleteLater(reply);
    }

    if (action === 'status') {
      return message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(availabilityState.enabled ? 0x2ECC71 : 0xE67E22)
            .setTitle('📣 Messages disponibilité automatiques')
            .setDescription([
              `Statut : **${availabilityState.enabled ? 'activés' : 'désactivés'}**`,
              `Salon : <#${AVAILABILITY_CHANNEL_ID}>`,
              availabilityState.lastSlot
                ? `Dernier message : **${availabilityState.lastSlot === 'morning' ? '11h' : '18h'}**`
                : 'Dernier message : **aucun**',
              availabilityState.lastMessageId ? `Message actuel : **${availabilityState.lastMessageId}**` : null
            ].filter(Boolean).join('\n'))
        ]
      });
    }

    const enabled = action === 'on';
    availabilityState.enabled = enabled;
    availabilityState.updatedAt = Date.now();
    availabilityState.updatedBy = message.author.id;
    saveAvailabilityState();

    if (!enabled) {
      await deleteStoredAvailabilityMessage();
    }

    await sendAdminLog(enabled ? '📣 Auto-dispo activé' : '📣 Auto-dispo désactivé', [
      `Owner : ${logUser(message.author)}`,
      `Salon commande : ${logChannel(message.channel)}`,
      `Salon annonces : <#${AVAILABILITY_CHANNEL_ID}>`,
      enabled ? 'Messages 11h/18h : activés' : 'Messages 11h/18h : désactivés et dernier message supprimé si présent'
    ], enabled ? 0x2ECC71 : 0xE67E22);

    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(enabled ? 0x2ECC71 : 0xE67E22)
          .setTitle(enabled ? '📣 Auto-dispo activé' : '📣 Auto-dispo désactivé')
          .setDescription(enabled
            ? 'Les messages automatiques de 11h et 18h sont réactivés.'
            : 'Les messages automatiques de 11h et 18h sont désactivés. Le dernier message dispo a été supprimé si le bot l’a retrouvé.')
      ]
    });
  }

  if (message.content.trim().split(/\s+/)[0] === '!maintenance') {
    if (!isOwnerMember(message.member)) {
      const reply = await message.channel.send('❌ Seul le rôle owner peut gérer la maintenance.');
      return deleteLater(reply);
    }

    const args = message.content.trim().split(/\s+/);
    const action = (args[1] || 'status').toLowerCase();
    const reason = args.slice(2).join(' ').trim();

    if (!['on', 'off', 'status'].includes(action)) {
      const reply = await message.channel.send('Utilisation : `!maintenance on [raison]`, `!maintenance off` ou `!maintenance status`');
      return deleteLater(reply);
    }

    if (action === 'status') {
      return message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(maintenanceState.enabled ? 0xE67E22 : 0x2ECC71)
            .setTitle('🛠️ Maintenance boutique')
            .setDescription([
              `Statut : **${maintenanceState.enabled ? 'activée' : 'désactivée'}**`,
              maintenanceState.updatedBy ? `Dernière modification : <@${maintenanceState.updatedBy}>` : null,
              maintenanceState.updatedAt ? `Date : <t:${Math.floor(maintenanceState.updatedAt / 1000)}:f>` : null,
              maintenanceState.reason ? `Raison : **${maintenanceState.reason}**` : null
            ].filter(Boolean).join('\n'))
        ]
      });
    }

    const enabled = action === 'on';
    setMaintenanceState(enabled, message.author, reason);

    await sendAdminLog(enabled ? '🛠️ Maintenance activée' : '✅ Maintenance désactivée', [
      `Owner : ${logUser(message.author)}`,
      `Salon : ${logChannel(message.channel)}`,
      reason ? `Raison : **${reason}**` : null
    ], enabled ? 0xE67E22 : 0x2ECC71);

    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(enabled ? 0xE67E22 : 0x2ECC71)
          .setTitle(enabled ? '🛠️ Maintenance activée' : '✅ Maintenance désactivée')
          .setDescription(enabled
            ? 'Les commandes et recharges sont maintenant bloquées pour les membres. Le support reste ouvert.'
            : 'Les commandes et recharges sont de nouveau disponibles.')
      ]
    });
  }

  if (message.content.trim().split(/\s+/)[0] === '!history') {
    if (!isOwnerMember(message.member)) {
      const reply = await message.channel.send('❌ Seul le rôle owner peut consulter l’historique portefeuille.');
      return deleteLater(reply);
    }

    const user = message.mentions.users.first();

    if (!user) {
      const reply = await message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(0xE74C3C)
            .setTitle('❌ Commande invalide')
            .setDescription('Utilisation : `!history @membre`')
        ]
      });

      return deleteLater(reply);
    }

    await sendAdminLog('👛 Historique portefeuille consulté', [
      `Owner : ${logUser(message.author)}`,
      `Membre : ${logUser(user)}`,
      `Salon : ${logChannel(message.channel)}`
    ], 0x3498DB);

    return message.channel.send({ embeds: [buildWalletHistoryEmbed(user)] });
  }

  if (message.content.trim().split(/\s+/)[0] === '!tickets') {
    if (!isOwnerMember(message.member)) {
      const reply = await message.channel.send('❌ Seul le rôle owner peut consulter l’historique tickets.');
      return deleteLater(reply);
    }

    const user = message.mentions.users.first();

    if (!user) {
      const reply = await message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(0xE74C3C)
            .setTitle('❌ Commande invalide')
            .setDescription('Utilisation : `!tickets @membre`')
        ]
      });

      return deleteLater(reply);
    }

    await sendAdminLog('🎫 Historique tickets consulté', [
      `Owner : ${logUser(message.author)}`,
      `Membre : ${logUser(user)}`,
      `Salon : ${logChannel(message.channel)}`
    ], 0x3498DB);

    return message.channel.send({ embeds: [buildTicketHistoryEmbed(user)] });
  }

  if (message.content.trim().split(/\s+/)[0] === '!refund') {
    if (!isOwnerMember(message.member)) {
      const reply = await message.channel.send('❌ Seul le rôle owner peut rembourser une commande.');
      return deleteLater(reply);
    }

    return createRefundConfirmation(message, getTicketRequest(message.channel.id));
  }

  if (message.content.trim().split(/\s+/)[0] === '!add') {
    if (!isOwnerMember(message.member)) {
      const reply = await message.channel.send('❌ Seul le rôle owner peut lancer cette commande.');
      return deleteLater(reply);
    }

    const ticketRequest = getTicketRequest(message.channel.id);
    const mentionedUser = message.mentions.users.first();
    const userId = mentionedUser ? mentionedUser.id : ticketRequest?.userId;
    const user = userId ? await client.users.fetch(userId).catch(() => null) : null;
    const args = message.content.trim().split(/\s+/);
    const amount = parseWalletAmount(mentionedUser ? args[2] : args[1]);

    if (!user || !Number.isFinite(amount) || amount <= 0) {
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

    await createWalletActionConfirmation(message, 'add', user, amount, ticketRequest);
    return;
  }

  if (message.content.trim().split(/\s+/)[0] === '!remove') {
    if (!isOwnerMember(message.member)) {
      const reply = await message.channel.send('❌ Seul le rôle owner peut lancer cette commande.');
      return deleteLater(reply);
    }

    const args = message.content.trim().split(/\s+/);
    const user = message.mentions.users.first();
    const amount = parseWalletAmount(args[2]);

    if (!user || !Number.isFinite(amount) || amount <= 0) {
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

    await createWalletActionConfirmation(message, 'remove', user, amount, null);
    return;
  }
  } catch (error) {
    await handleMessageError(message, error);
  }
});

client.on(Events.InteractionCreate, async interaction => {
  let actionLockKey = null;
  let actionLockAcquired = false;

  try {
  if (interaction.isButton()) {
    actionLockKey = interactionActionLockKey(interaction);

    if (actionLockKey) {
      actionLockAcquired = acquireInteractionActionLock(actionLockKey);

      if (!actionLockAcquired) {
        return interaction.reply({
          content: '⏳ Une action est déjà en cours. Réessaie dans quelques secondes.',
          ephemeral: true
        }).catch(() => {});
      }
    }

    if (
      interaction.customId.startsWith('confirm_wallet_action:') ||
      interaction.customId.startsWith('cancel_wallet_action:')
    ) {
      return handleWalletActionButton(interaction);
    }

    if (
      interaction.customId.startsWith('confirm_refund_action:') ||
      interaction.customId.startsWith('cancel_refund_action:')
    ) {
      return handleRefundActionButton(interaction);
    }

    if (
      interaction.customId.startsWith('accept_recharge_proof:') ||
      interaction.customId.startsWith('reject_recharge_proof:')
    ) {
      return handleRechargeProofButton(interaction);
    }

    if (interaction.customId === 'guide_faq') {
      return interaction.reply({
        embeds: [buildGuideFaqEmbed(interaction.guild)],
        ephemeral: true
      });
    }

    if (interaction.customId.startsWith('edit_payment_config:')) {
      if (!isOwnerMember(interaction.member)) {
        return interaction.reply({
          content: '❌ Seul le rôle owner peut modifier les moyens de paiement.',
          ephemeral: true
        });
      }

      const method = interaction.customId.split(':')[1];
      if (!['paypal', 'revolut', 'iban'].includes(method)) {
        return interaction.reply({
          content: '❌ Moyen de paiement invalide.',
          ephemeral: true
        });
      }

      const modal = new ModalBuilder()
        .setCustomId(`payment_config_modal:${method}`)
        .setTitle(`Modifier ${paymentConfigFieldLabel(method)}`.slice(0, 45));

      const valueInput = new TextInputBuilder()
        .setCustomId('payment_config_value')
        .setLabel(paymentConfigFieldLabel(method))
        .setStyle(method === 'iban' ? TextInputStyle.Paragraph : TextInputStyle.Short)
        .setRequired(true)
        .setMinLength(3)
        .setMaxLength(method === 'iban' ? 500 : 300)
        .setValue((method === 'iban' ? paymentConfigValue('virement') : paymentConfigValue(method)).slice(0, method === 'iban' ? 500 : 300));

      modal.addComponents(new ActionRowBuilder().addComponents(valueInput));
      return interaction.showModal(modal);
    }

    if (interaction.customId.startsWith('open_announcement_modal:')) {
      if (!isOwnerMember(interaction.member)) {
        return interaction.reply({
          content: '❌ Seul le rôle owner peut créer une annonce.',
          ephemeral: true
        });
      }

      const modal = new ModalBuilder()
        .setCustomId(`announcement_modal:${interaction.user.id}`)
        .setTitle('Créer une annonce');

      const titleInput = new TextInputBuilder()
        .setCustomId('announcement_title')
        .setLabel('Titre')
        .setPlaceholder('Exemple : Promo ce soir')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMinLength(2)
        .setMaxLength(100);

      const bodyInput = new TextInputBuilder()
        .setCustomId('announcement_body')
        .setLabel('Message')
        .setPlaceholder('Exemple : -20% sur toute la boutique jusqu’à 23h.')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setMinLength(2)
        .setMaxLength(1800);

      const typeInput = new TextInputBuilder()
        .setCustomId('announcement_type')
        .setLabel('Type : info, promo ou important')
        .setPlaceholder('info')
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
        .setMaxLength(20);

      modal.addComponents(
        new ActionRowBuilder().addComponents(titleInput),
        new ActionRowBuilder().addComponents(bodyInput),
        new ActionRowBuilder().addComponents(typeInput)
      );

      return interaction.showModal(modal);
    }

    if (interaction.customId.startsWith('toggle_stock:')) {
      if (!isOwnerMember(interaction.member)) {
        return interaction.reply({
          content: '❌ Seul le rôle owner peut gérer le stock.',
          ephemeral: true
        });
      }

      const productId = interaction.customId.split(':')[1];
      const product = getProduct(productId);

      if (!product) {
        return interaction.reply({
          content: '❌ Produit introuvable.',
          ephemeral: true
        });
      }

      const available = toggleProductAvailability(productId, interaction.user);

      await sendAdminLog(available ? '📦 Produit remis en stock' : '📦 Produit mis indisponible', [
        `Owner : ${logUser(interaction.user)}`,
        `Produit : **${product.label}**`,
        `Nouvel état : **${available ? 'Disponible' : 'Indisponible'}**`,
        `Salon : ${logChannel(interaction.channel)}`
      ], available ? 0x2ECC71 : 0xE67E22);

      await interaction.update({
        embeds: [buildStockEditorEmbed(interaction.guild)],
        components: buildStockEditorRows()
      });

      return interaction.followUp({
        content: available
          ? `✅ **${product.label}** est maintenant disponible.`
          : `❌ **${product.label}** est maintenant indisponible.`,
        ephemeral: true
      });
    }

    if (interaction.customId.startsWith('edit_price:')) {
      if (!isOwnerMember(interaction.member)) {
        return interaction.reply({
          content: '❌ Seul le rôle owner peut modifier les prix.',
          ephemeral: true
        });
      }

      const productId = interaction.customId.split(':')[1];
      const product = getProduct(productId);

      if (!product) {
        return interaction.reply({
          content: '❌ Produit introuvable.',
          ephemeral: true
        });
      }

      const modal = new ModalBuilder()
        .setCustomId(`edit_price_modal:${productId}`)
        .setTitle(`Prix ${productPointsLabel(product)}`.slice(0, 45));

      const priceInput = new TextInputBuilder()
        .setCustomId('price')
        .setLabel('Nouveau prix en euros')
        .setPlaceholder(`Prix actuel : ${formatProductPrice(productId, { includeDiscount: false, ignoreAvailability: true })} | Exemple : 4.50`)
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMinLength(1)
        .setMaxLength(8);

      modal.addComponents(new ActionRowBuilder().addComponents(priceInput));
      return interaction.showModal(modal);
    }

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

    if (interaction.customId === 'get_referral_stats') {
      sendActionLog(interaction.member, '👥 Stats parrainage demandées', [
        `Membre : ${logUser(interaction.user)}`,
        `Affichage : message éphémère dans ${logChannel(interaction.channel)}`
      ], 0x3498DB);

      return interaction.reply({
        embeds: [buildReferralStatsEmbed(interaction.user)],
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

      let completionResult = { dmSent: false };

      try {
        await interaction.message.edit({
          components: [ticketButtons(ownerId, ticketRequest, { includeTake: false })]
        }).catch(() => {});
        completionResult = await completeOrderTicketChannel(interaction.channel, ticketRequest, interaction.user, ownerId);
      } catch (error) {
        await interaction.editReply(`❌ Impossible de terminer la commande : ${error.message}`);
        return;
      }

      let customerRoleAdded = false;
      let customerRoleError = null;

      try {
        customerRoleAdded = await addCustomerRoleAfterCompletedOrder(interaction.guild, ticketRequest);
      } catch (error) {
        customerRoleError = error;
      }

      await sendAdminLog('✅ Commande terminée', [
        `Par : ${logUser(interaction.user)}`,
        `Ticket : ${logChannel(interaction.channel)}`,
        `Demande : **${ticketRequest.id}**`,
        `Client : <@${ticketRequest.userId}>`,
        `Produit : **${ticketRequest.product || 'Non précisé'}**`,
        `Catégorie : <#${ORDER_DONE_CATEGORY}>`,
        completionResult?.dmSent ? 'MP client : envoyé' : 'MP client : non envoyé',
        customerRoleAdded
          ? `Rôle client : <@&${CUSTOMER_ROLE_ID}> ajouté ou déjà présent`
          : `Rôle client : non ajouté${customerRoleError ? ` (${customerRoleError.message})` : ''}`
      ], customerRoleError ? 0xF1C40F : 0x2ECC71);

      await interaction.editReply(customerRoleError
        ? `✅ Commande terminée, ticket déplacé et message final envoyé.\n⚠️ ${customerRoleError.message}`
        : '✅ Commande terminée, ticket déplacé, rôle client appliqué et message final envoyé.');
      return;
    }

    if (interaction.customId.startsWith('take_ticket:')) {
      const ownerId = interaction.customId.split(':')[1];
      const ticketRequest = getTicketRequest(interaction.channel.id);

      if (!isOwnerMember(interaction.member)) {
        return interaction.reply({
          content: '❌ Seul le rôle owner peut prendre un ticket en charge.',
          ephemeral: true
        });
      }

      if (!ticketRequest || ticketRequest.archivedAt || ticketRequest.deletedAt || ticketRequest.completedAt) {
        return interaction.reply({
          content: '❌ Ce ticket ne peut pas être pris en charge.',
          ephemeral: true
        });
      }

      if (ticketRequest.takenBy) {
        return interaction.reply({
          content: ticketRequest.takenBy === interaction.user.id
            ? '✅ Tu as déjà pris ce ticket en charge.'
            : `❌ Ce ticket est déjà pris en charge par <@${ticketRequest.takenBy}>.`,
          ephemeral: true
        });
      }

      await interaction.deferReply({ ephemeral: true });

      ticketRequest.takenBy = interaction.user.id;
      ticketRequest.takenAt = Date.now();
      upsertTicketHistory(ticketRequest);
      saveRequests();
      scheduleDataBackup('ticket_taken', interaction.user);

      await interaction.message.edit({
        components: [ticketButtonsForRequest(ticketRequest, ownerId)]
      }).catch(() => {});

      await interaction.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(0x3498DB)
            .setTitle('🙋 Ticket pris en charge')
            .setDescription([
              `Pris en charge par : ${interaction.user}`,
              `Demande : **${ticketRequest.id}**`,
              `Client : <@${ticketRequest.userId}>`
            ].join('\n'))
            .setTimestamp()
        ]
      });

      await sendAdminLog('🙋 Ticket pris en charge', [
        `Owner : ${logUser(interaction.user)}`,
        `Ticket : ${logChannel(interaction.channel)}`,
        `Demande : **${ticketRequest.id}**`,
        `Type : **${ticketTypeLabel(ticketRequest.type)}**`,
        `Client : <@${ticketRequest.userId}>`
      ], 0x3498DB);

      return interaction.editReply('✅ Ticket pris en charge.');
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
        clearTicketCleanup(interaction.channel.id);

        sendAdminLog('🗑️ Ticket supprimé définitivement', [
          `Par : ${logUser(interaction.user)}`,
          `Ticket : ${logChannel(interaction.channel)}`,
          ticketRequest ? `Demande : **${ticketRequest.id}**` : 'Demande : inconnue',
          ticketRequest ? `Type : **${ticketRequest.type}**` : null,
          ticketRequest ? `Client : <@${ticketRequest.userId}>` : null
        ], 0xE74C3C);

        upsertTicketHistory(ticketRequest, {
          deletedAt: Date.now(),
          deletedBy: interaction.user.id,
          deletedReason: 'Suppression définitive manuelle'
        });
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
      const ticketConfirmation = await confirmOpeningAnotherTicket(interaction, 'support');
      if (!ticketConfirmation.confirmed) return;
      const responseInteraction = ticketConfirmation.interaction;
      const channelBaseName = sanitizeChannelName(interaction.user.username);

      const ticket = await interaction.guild.channels.create({
        name: buildTicketChannelName('attente-client', channelBaseName),
        parent: SUPPORT_CATEGORY,
        type: ChannelType.GuildText,
        permissionOverwrites: supportTicketPermissionOverwrites(interaction.guild, interaction.user.id)
      });

      const request = createRequest('support', ticket.id, interaction.user.id, { channelBaseName });
      await ticket.send({
        content: `🚨 Ticket support

🧾 Demande : #${request.id}
👤 Client : <@${interaction.user.id}>

📩 Explique ton problème ici.
👥 Un administrateur va te répondre dès que possible.`,
        components: [ticketButtons(interaction.user.id, request)]
      });

      await ticket.send([
        '✅ **Ticket support pris en compte**',
        '',
        'Votre demande a bien été enregistrée.',
        `<@&${STAFF_ROLE_ID}> et <@&${TICKET_ACCESS_ROLE_ID}> ont été informés et vont prendre en charge votre demande.`,
        '',
        'Merci de rester disponible dans ce ticket.',
        'Le staff vous répondra dès que possible.'
      ].join('\n'));
      scheduleDataBackup('support_ticket_created', interaction.user);

      sendAdminLog('🚨 Ticket support créé', [
        `Client : ${logUser(interaction.user)}`,
        `Demande : **${request.id}**`,
        `Ticket : ${logChannel(ticket)}`
      ], 0xF1C40F);

      return replyTemp(responseInteraction, {
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
      if (isMaintenanceEnabledFor(interaction.member)) {
        return replyMaintenance(interaction);
      }

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
      if (isMaintenanceEnabledFor(interaction.member)) {
        return replyMaintenance(interaction);
      }

      sendActionLog(interaction.member, '🎫 Fenêtre commande ouverte', [
        `Membre : ${logUser(interaction.user)}`,
        `Salon : ${logChannel(interaction.channel)}`
      ], 0x3498DB);

      const orderEmbed = new EmbedBuilder()
        .setColor(0xD4AF37)
        .setTitle(`Boutique McDonald's ${MCDONALDS_EMOJI}`)
        .setDescription([
          'Sélectionne le produit que tu veux commander.',
          '',
          'Les produits sont affichés avec leur nombre de **pts**.',
          'Le prix est indiqué directement sous chaque produit dans le menu.',
          'Le montant sera retiré automatiquement de ton portefeuille après ton choix.'
        ].join('\n'))
        .setFooter({ text: 'La Rent’a • Sélection produit' });

      const productMenu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('produits')
          .setPlaceholder('Choisir un produit McDonald’s...')
          .addOptions(products.map(product => ({
            label: productMenuLabel(product),
            description: productMenuDescription(product),
            value: product.value,
            emoji: MCDONALDS_BUTTON_EMOJI
          })))
      );

      return replyTemp(interaction, { embeds: [orderEmbed], components: [productMenu], ephemeral: true }, 120_000);
    }
  }

  if (interaction.isModalSubmit() && interaction.customId.startsWith('announcement_modal:')) {
    if (!isOwnerMember(interaction.member)) {
      return interaction.reply({
        content: '❌ Seul le rôle owner peut créer une annonce.',
        ephemeral: true
      });
    }

    const title = interaction.fields.getTextInputValue('announcement_title').trim();
    const body = interaction.fields.getTextInputValue('announcement_body').trim();
    const type = interaction.fields.getTextInputValue('announcement_type').trim() || 'info';

    if (!title || !body) {
      return interaction.reply({
        content: '❌ Titre ou message invalide.',
        ephemeral: true
      });
    }

    const channel = client.channels.cache.get(AVAILABILITY_CHANNEL_ID)
      || await client.channels.fetch(AVAILABILITY_CHANNEL_ID).catch(() => null);

    if (!channel || typeof channel.send !== 'function') {
      return interaction.reply({
        content: `❌ Impossible de trouver le salon d’annonce : <#${AVAILABILITY_CHANNEL_ID}>.`,
        ephemeral: true
      });
    }

    const embed = buildAnnouncementEmbed(title, body, type);
    const sent = await channel.send({ embeds: [embed] })
      .catch(async error => {
        await reportCrash('Envoi annonce impossible', error, [
          `Owner : ${logUser(interaction.user)}`,
          `Salon annonce : <#${AVAILABILITY_CHANNEL_ID}>`
        ]);
        return null;
      });

    if (!sent) {
      return interaction.reply({
        content: '❌ Impossible d’envoyer l’annonce.',
        ephemeral: true
      });
    }

    await sendAdminLog('📣 Annonce envoyée', [
      `Owner : ${logUser(interaction.user)}`,
      `Salon annonce : ${logChannel(channel)}`,
      `Titre : **${title.slice(0, 200)}**`,
      `Type : **${announcementTypeConfig(type).label}**`
    ], 0x2ECC71);

    return interaction.reply({
      content: `✅ Annonce envoyée dans <#${AVAILABILITY_CHANNEL_ID}>.`,
      ephemeral: true
    });
  }

  if (interaction.isModalSubmit() && interaction.customId.startsWith('payment_config_modal:')) {
    if (!isOwnerMember(interaction.member)) {
      return interaction.reply({
        content: '❌ Seul le rôle owner peut modifier les moyens de paiement.',
        ephemeral: true
      });
    }

    const method = interaction.customId.split(':')[1];
    const value = interaction.fields.getTextInputValue('payment_config_value').trim();

    if (!['paypal', 'revolut', 'iban'].includes(method) || value.length < 3) {
      return interaction.reply({
        content: '❌ Valeur invalide.',
        ephemeral: true
      });
    }

    const oldValue = method === 'iban' ? paymentConfigValue('virement') : paymentConfigValue(method);
    setPaymentConfigValue(method, value, interaction.user);

    await sendAdminLog('💳 Moyen de paiement modifié', [
      `Owner : ${logUser(interaction.user)}`,
      `Moyen : **${paymentConfigFieldLabel(method)}**`,
      `Ancienne valeur : \`${paymentConfigInlineValue(oldValue).slice(0, 900)}\``,
      `Nouvelle valeur : \`${paymentConfigInlineValue(value).slice(0, 900)}\``
    ], 0x3498DB);

    return interaction.reply({
      embeds: [buildPaymentConfigEmbed(interaction.guild)],
      content: `✅ ${paymentConfigFieldLabel(method)} modifié.`,
      ephemeral: true
    });
  }

  if (interaction.isModalSubmit() && interaction.customId.startsWith('edit_price_modal:')) {
    if (!isOwnerMember(interaction.member)) {
      return interaction.reply({
        content: '❌ Seul le rôle owner peut modifier les prix.',
        ephemeral: true
      });
    }

    const productId = interaction.customId.split(':')[1];
    const product = getProduct(productId);
    const price = parseProductPriceInput(interaction.fields.getTextInputValue('price'));

    if (!product || !Number.isFinite(price) || price <= 0 || price > 500) {
      return interaction.reply({
        content: '❌ Prix invalide. Entre un prix entre 0.01€ et 500€.',
        ephemeral: true
      });
    }

    const oldPrice = getProductBasePrice(productId);
    setProductPrice(productId, price, interaction.user);
    const newPrice = getProductBasePrice(productId);

    await sendAdminLog('💰 Prix McDonald’s modifié', [
      `Owner : ${logUser(interaction.user)}`,
      `Produit : **${product.label}**`,
      `Ancien prix : **${formatWalletAmount(oldPrice)}**`,
      `Nouveau prix : **${formatWalletAmount(newPrice)}**`,
      isDiscountActive() ? `Prix boutique avec réduction : **${formatProductPrice(productId)}**` : null,
      `Salon : ${logChannel(interaction.channel)}`
    ], 0x2ECC71);

    return interaction.reply({
      content: [
        `✅ Prix modifié : **${product.label}** passe de **${formatWalletAmount(oldPrice)}** à **${formatWalletAmount(newPrice)}**.`,
        isDiscountActive() ? `🏷️ Prix boutique avec réduction : **${formatProductPrice(productId)}**.` : null
      ].filter(Boolean).join('\n'),
      ephemeral: true
    });
  }

  if (interaction.isModalSubmit() && interaction.customId === 'recharge_amount') {
    if (isMaintenanceEnabledFor(interaction.member)) {
      return replyMaintenance(interaction);
    }

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
      if (isMaintenanceEnabledFor(interaction.member)) {
        return replyMaintenance(interaction);
      }

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

      const ticketConfirmation = await confirmOpeningAnotherTicket(interaction, 'recharge');
      if (!ticketConfirmation.confirmed) return;
      const responseInteraction = ticketConfirmation.interaction;

      pendingRecharges.delete(pendingRechargeKey(interaction));
      const channelBaseName = sanitizeChannelName(interaction.user.username);

      const ticket = await interaction.guild.channels.create({
        name: buildTicketChannelName('attente-screen', channelBaseName),
        parent: TICKET_CATEGORY,
        type: ChannelType.GuildText,
        permissionOverwrites: adminTicketPermissionOverwrites(interaction.guild)
      });

      const request = createRequest('recharge', ticket.id, interaction.user.id, {
        channelBaseName,
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
        components: [ticketButtons(interaction.user.id, request)]
      });
      scheduleDataBackup('recharge_request_created', interaction.user);

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

      return replyTemp(responseInteraction, {
        content: dmSent
          ? `✅ Demande de recharge créée pour ${amount}.\n📩 Va dans tes messages privés : le bot t’a envoyé un MP.\n➡️ Suis les instructions dans ce message privé.\n🧾 Demande : #${request.id}`
          : `⚠️ Demande créée, mais impossible de t’envoyer un MP. Contacte le staff.\n🧾 Demande : #${request.id}`,
        ephemeral: true
      });
    }

    if (interaction.customId === 'produits') {
      return handleProductOrder(interaction, interaction.values[0]);
    }
  }
  } catch (error) {
    await handleInteractionError(interaction, error);
  } finally {
    if (actionLockAcquired) releaseInteractionActionLock(actionLockKey);
  }
});

client.login(process.env.DISCORD_TOKEN).catch(error => {
  reportCrash('Connexion Discord impossible', error, [
    'Vérifie que `DISCORD_TOKEN` est bien configuré.'
  ]);
});
