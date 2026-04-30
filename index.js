const fs = require('fs');
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
const TICKET_CATEGORY = '1495800617204187216';
const ORDER_CATEGORY = '1495800432776446063';
const SUPPORT_CATEGORY = '1499036733986308146';
const SHOP_CHANNEL_ID = '1310381741218988122';
const SUPPORT_CHANNEL_ID = '1498434089450078258';
const LOG_CHANNEL_ID = '1310354201704136747';
const INVITE_ANNOUNCE_CHANNEL_ID = '1310355769824383059';
const INVITE_ADMIN_CHANNEL_ID = '1499523428112142568';
const RULES_ROLE_ID = '1310359454377840650';
const DELETE_DELAY = 10_000;

const SHOP_EMOJI = '🛒';
const INFO_IMAGE = process.env.INFO_IMAGE || 'https://media.discordapp.net/attachments/1499072550985269268/1499121030491541585/IMG_1333.jpg?ex=69f4f641&is=69f3a4c1&hm=1f19f9ceb27d07466a27fcb29c1fe6fd35d2699006a35d395e827735eb547bee&=&format=webp&width=623&height=944';
const PAYPAL_LINK = 'https://paypal.me/AntoninChenot';
const REVOLUT_LINK = 'https://revolut.me/antoni7mcq';
const IBAN = 'FR76 2823 3000 0176 1307 4771 273';
const NO_NOTE_TEXT = '❗❗ Ne mettre aucune note lors du paiement ❗❗';

let wallets = fs.existsSync('wallets.json')
  ? JSON.parse(fs.readFileSync('wallets.json'))
  : {};

let requests = fs.existsSync('requests.json')
  ? JSON.parse(fs.readFileSync('requests.json'))
  : { counter: 0, tickets: {} };

let referrals = fs.existsSync('referrals.json')
  ? JSON.parse(fs.readFileSync('referrals.json'))
  : { invitedBy: {}, stats: {}, inviteLinks: {} };

if (!referrals.inviteLinks) referrals.inviteLinks = {};

const pendingRecharges = new Map();
const guildInviteUses = new Map();

function saveWallets() {
  fs.writeFileSync('wallets.json', JSON.stringify(wallets, null, 2));
}

function saveRequests() {
  fs.writeFileSync('requests.json', JSON.stringify(requests, null, 2));
}

function saveReferrals() {
  fs.writeFileSync('referrals.json', JSON.stringify(referrals, null, 2));
}

function isAdminMember(member) {
  return member.roles.cache.has(ADMIN_ROLE_ID) || member.permissions.has(PermissionFlagsBits.Administrator);
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

  if (!usedInvite || !usedInvite.inviter || usedInvite.inviter.id === member.id) {
    return null;
  }

  if (!referrals.invitedBy[member.id]) {
    referrals.invitedBy[member.id] = {
      guildId: member.guild.id,
      inviterId: usedInvite.inviter.id,
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

  sendBotLog('🎁 Parrainage récompensé', [
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
  { label: 'McDonald\'s 50-74', description: '2€', value: '50_74', price: 2 },
  { label: 'McDonald\'s 75-99', description: '4€', value: '75_99', price: 4 },
  { label: 'McDonald\'s 100-124', description: '6€', value: '100_124', price: 6 },
  { label: 'McDonald\'s 125-149', description: '7€', value: '125_149', price: 7 },
  { label: 'McDonald\'s 150-174', description: '8€', value: '150_174', price: 8 },
  { label: 'McDonald\'s 175-199', description: '10€', value: '175_199', price: 10 },
  { label: 'McDonald\'s 200-224', description: '11€', value: '200_224', price: 11 },
  { label: 'McDonald\'s 225-249', description: '12€', value: '225_249', price: 12 },
  { label: 'McDonald\'s 250-274', description: '13€', value: '250_274', price: 13 },
  { label: 'McDonald\'s 275-299', description: '14€', value: '275_299', price: 14 },
  { label: 'McDonald\'s 300-324', description: '15€', value: '300_324', price: 15 },
  { label: 'McDonald\'s 325-349', description: '16€', value: '325_349', price: 16 },
  { label: 'McDonald\'s 350-374', description: '17€', value: '350_374', price: 17 },
  { label: 'McDonald\'s 400-499', description: '18€', value: '400_499', price: 18 },
  { label: 'McDonald\'s 500-599', description: '21€', value: '500_599', price: 21 },
  { label: 'McDonald\'s 600-699', description: '30€', value: '600_699', price: 30 },
  { label: 'McDonald\'s 700-799', description: '34€', value: '700_799', price: 34 },
  { label: 'McDonald\'s 800-899', description: '40€', value: '800_899', price: 40 },
  { label: 'McDonald\'s 1000-1099', description: '51€', value: '1000_1099', price: 51 },
  { label: 'McDonald\'s 1100-1199', description: '67€', value: '1100_1199', price: 67 }
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
    { id: ADMIN_ROLE_ID, allow: ticketAllow }
  ];
}

function canManageTicket(interaction, ownerId) {
  return (
    interaction.user.id === ownerId ||
    interaction.member.roles.cache.has(STAFF_ROLE_ID) ||
    interaction.member.roles.cache.has(ADMIN_ROLE_ID) ||
    interaction.member.permissions.has(PermissionFlagsBits.Administrator)
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

function productListText() {
  return products
    .map(product => `💰  ${product.label.padEnd(15, ' ')} →   ${product.description}`)
    .join('\n\n');
}

async function sendBotLog(title, lines, color = 0x3498DB) {
  const channel = client.channels.cache.get(LOG_CHANNEL_ID)
    || await client.channels.fetch(LOG_CHANNEL_ID).catch(() => null);

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
  console.log('Bot connecte');
  await Promise.all(client.guilds.cache.map(guild => cacheGuildInvites(guild)));
  sendBotLog('🟢 Bot connecté', `Connecté en tant que **${client.user.tag}**`, 0x2ECC71);
});

client.on('error', error => {
  console.error('Erreur client Discord :', error);
  if (client.isReady()) {
    sendBotLog('🔴 Erreur client Discord', `\`\`\`\n${formatRuntimeError(error)}\n\`\`\``, 0xE74C3C);
  }
});

process.on('unhandledRejection', error => {
  console.error('Promesse rejetée non gérée :', error);
  if (client.isReady()) {
    sendBotLog('🔴 Erreur non gérée', `\`\`\`\n${formatRuntimeError(error)}\n\`\`\``, 0xE74C3C);
  }
});

process.on('uncaughtException', error => {
  console.error('Exception non capturée :', error);
  if (client.isReady()) {
    sendBotLog('🔴 Exception non capturée', `\`\`\`\n${formatRuntimeError(error)}\n\`\`\``, 0xE74C3C);
  }
});

client.on(Events.InviteCreate, invite => {
  if (invite.guild) cacheGuildInvites(invite.guild);
});

client.on(Events.InviteDelete, invite => {
  if (invite.guild) cacheGuildInvites(invite.guild);
});

client.on(Events.GuildMemberAdd, async member => {
  const referral = await recordMemberInvite(member);

  if (!referral) {
    sendInviteJoinAnnouncement(member, null);
    sendInviteAdminAnnouncement(member, null);
    return;
  }

  sendInviteJoinAnnouncement(member, referral);
  sendInviteAdminAnnouncement(member, referral);
});

client.on('messageCreate', async message => {
  if (message.author.bot) return;

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

    await sendBotLog('📸 Screenshot recharge reçu', [
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

      await sendBotLog('⛔ Commande refusée', [
        `Utilisateur : ${logUser(message.author)}`,
        `Salon : ${logChannel(message.channel)}`,
        `Commande : \`${message.content.slice(0, 1000)}\``
      ], 0xE74C3C);

      return deleteLater(reply);
    }

    await sendBotLog('🛠️ Commande admin utilisée', [
      `Admin : ${logUser(message.author)}`,
      `Salon : ${logChannel(message.channel)}`,
      `Commande : \`${message.content.slice(0, 1000)}\``
    ], 0x95A5A6);
  }

  if (message.content === '!setup') {
    const embed = new EmbedBuilder()
      .setColor(0xD4AF37)
      .setAuthor({ name: 'Boutique', iconURL: message.guild.iconURL({ dynamic: true }) })
      .setTitle(`${SHOP_EMOJI} Boutique`)
      .setDescription([
        '**Bienvenue sur la boutique.**',
        'Recharge ton portefeuille, choisis ton produit, puis le staff traite ta commande en ticket privé.',
        '',
        '**Comment commander**',
        '1. Clique sur **Portefeuille** pour vérifier ton solde.',
        '2. Clique sur **Recharger** si ton solde est insuffisant.',
        '3. Clique sur **Commander** et sélectionne ton produit.',
        '',
        '**Moyens de paiement**',
        '🅿️ PayPal  •  💳 Revolut  •  🏦 Virement bancaire',
        '',
        '**Tarifs**',
        '```',
        productListText(),
        '```'
      ].join('\n'))
      .setThumbnail(message.guild.iconURL({ dynamic: true }))
      .setFooter({ text: 'Portefeuille • Recharge • Commande • Support' });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('wallet').setLabel('Portefeuille').setEmoji('👛').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('recharger').setLabel('Recharger').setEmoji('➕').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('commande').setLabel('Commander').setEmoji('🎫').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('infos_points').setLabel('Fidélité Mcdo').setEmoji('🎁').setStyle(ButtonStyle.Secondary)
    );

    return message.channel.send({ embeds: [embed], components: [row] });
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
        '4. Choisis ton moyen de paiement : PayPal 🅿️, Revolut 💳 ou Virement 🏦.',
        '',
        '5. Le bot t’envoie les instructions en message privé.',
        '',
        '6. Envoie ton screenshot de paiement au bot en message privé.',
        '',
        '7. Un administrateur vérifie puis crédite ton portefeuille.',
        '',
        '**Commander 🎫**',
        '',
        `1. Va dans <#${SHOP_CHANNEL_ID}>.`,
        '',
        '2. Clique sur **Portefeuille 👛** pour vérifier ton solde.',
        '',
        '3. Clique sur **Commander 🎫**.',
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
      .setTitle(`${SHOP_EMOJI} Tarifs McDonald's`)
      .setDescription([
        '**Grille des tarifs disponibles.**',
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
        '**Voici les moyens de paiement disponibles pour recharger ton solde.**',
        `Pour recharger ton solde, va ici : <#${SHOP_CHANNEL_ID}>.`,
        '',
        `**${NO_NOTE_TEXT}**`,
        '',
        'Clique sur **Recharger** pour recevoir les informations de paiement en message privé.',
        'Après le paiement, envoie ton screenshot au bot en message privé.'
      ].join('\n'))
      .addFields(
        {
          name: 'PayPal 🅿️',
          value: 'Disponible via le bouton **Recharger**.',
          inline: false
        },
        {
          name: 'Revolut 💳',
          value: 'Disponible via le bouton **Recharger**.',
          inline: false
        },
        {
          name: 'Virement bancaire 🏦',
          value: 'Disponible via le bouton **Recharger**.',
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
    const avisEmbed = new EmbedBuilder()
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

    return message.channel.send({ embeds: [avisEmbed] });
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

    await sendBotLog('👛 Portefeuille consulté', [
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

    await sendBotLog('👥 Parrainage consulté', [
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

    await sendBotLog('🏆 Top parrainage consulté', [
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

  if (message.content.startsWith('!addmoney')) {
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
            .setDescription('Utilisation : `!addmoney @user montant` ou `!addmoney montant` dans un ticket recharge.')
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

      await sendBotLog('✅ Recharge validée', [
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
        await message.channel.send('✅ Le ticket se fermera dans 10 secondes.');
        delete requests.tickets[message.channel.id];
        saveRequests();
        setTimeout(() => message.channel.delete().catch(() => {}), 10_000);
      }

      return;
    }

    await sendBotLog('💰 Solde ajouté', [
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

  if (message.content.startsWith('!removemoney')) {
    const args = message.content.split(' ');
    const user = message.mentions.users.first();
    const amount = parseFloat(args[2]);

    if (!user || !Number.isFinite(amount)) {
      const reply = await message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(0xE74C3C)
            .setTitle('❌ Commande invalide')
            .setDescription('Utilisation : `!removemoney @user montant`')
        ]
      });

      return deleteLater(reply);
    }

    if (!wallets[user.id]) wallets[user.id] = { balance: 0 };
    wallets[user.id].balance -= amount;
    saveWallets();

    await sendBotLog('💸 Solde retiré', [
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
});

client.on(Events.InteractionCreate, async interaction => {
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

      sendBotLog('🎟️ Lien parrainage demandé', [
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

      sendBotLog('✅ Règlement accepté', [
        `Membre : ${logUser(interaction.user)}`,
        `Rôle donné : <@&${RULES_ROLE_ID}>`
      ], 0x2ECC71);

      return interaction.reply({
        content: '✅ Règlement accepté, tu as maintenant accès au serveur.',
        ephemeral: true
      });
    }

    if (interaction.customId.startsWith('delete_ticket:')) {
      const ownerId = interaction.customId.split(':')[1];
      if (!canManageTicket(interaction, ownerId)) {
        return interaction.reply({ content: '❌ Tu ne peux pas supprimer ce ticket.', ephemeral: true });
      }

      const confirmRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`confirm_delete_ticket:${ownerId}`).setLabel('Confirmer').setEmoji('✅').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('cancel_delete_ticket').setLabel('Annuler').setEmoji('❌').setStyle(ButtonStyle.Secondary)
      );

      return interaction.reply({
        content: '⚠️ Confirmer la suppression de ce ticket ?',
        components: [confirmRow],
        ephemeral: true
      });
    }

    if (interaction.customId.startsWith('confirm_delete_ticket:')) {
      const ownerId = interaction.customId.split(':')[1];
      if (!canManageTicket(interaction, ownerId)) {
        return interaction.reply({ content: '❌ Tu ne peux pas supprimer ce ticket.', ephemeral: true });
      }

      const ticketRequest = getTicketRequest(interaction.channel.id);
      sendBotLog('🗑️ Ticket supprimé', [
        `Par : ${logUser(interaction.user)}`,
        `Ticket : ${logChannel(interaction.channel)}`,
        ticketRequest ? `Demande : **${ticketRequest.id}**` : 'Demande : inconnue',
        ticketRequest ? `Type : **${ticketRequest.type}**` : null,
        ticketRequest ? `Client : <@${ticketRequest.userId}>` : null
      ], 0xE74C3C);

      delete requests.tickets[interaction.channel.id];
      saveRequests();
      await interaction.reply({ content: '🗑️ Ticket supprimé dans 5 secondes...', ephemeral: true });
      setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
      return;
    }

    if (interaction.customId === 'cancel_delete_ticket') {
      return interaction.update({ content: '✅ Suppression annulée.', components: [] });
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

      sendBotLog('🚨 Ticket support créé', [
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
      sendBotLog('👛 Portefeuille consulté', [
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
      sendBotLog('🎁 Fidélité Mcdo consultée', [
        `Membre : ${logUser(interaction.user)}`,
        `Salon : ${logChannel(interaction.channel)}`
      ], 0x3498DB);

      return replyTemp(interaction, { embeds: [infoEmbed], ephemeral: true }, 30_000);
    }

    if (interaction.customId === 'recharger') {
      sendBotLog('➕ Recharge ouverte', [
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
      sendBotLog('🎫 Fenêtre commande ouverte', [
        `Membre : ${logUser(interaction.user)}`,
        `Salon : ${logChannel(interaction.channel)}`
      ], 0x3498DB);

      const orderEmbed = new EmbedBuilder()
        .setColor(0xD4AF37)
        .setTitle('🎫 Fenêtre de commande')
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

    sendBotLog('🧾 Recharge renseignée', [
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

      sendBotLog('💳 Demande de recharge créée', [
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
      sendBotLog('⚠️ Commande refusée - solde insuffisant', [
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
      components: [ticketButtons(interaction.user.id)]
    });

    sendBotLog('🎫 Commande créée', [
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
});

client.login(process.env.DISCORD_TOKEN);
