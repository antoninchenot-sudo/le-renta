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
const DELETE_DELAY = 10_000;

const SHOP_EMOJI = '🛒';
const INFO_IMAGE = process.env.INFO_IMAGE || 'https://media.discordapp.net/attachments/1499072550985269268/1499121030491541585/IMG_1333.jpg?ex=69f4f641&is=69f3a4c1&hm=1f19f9ceb27d07466a27fcb29c1fe6fd35d2699006a35d395e827735eb547bee&=&format=webp&width=623&height=944';
const PAYPAL_LINK = 'https://paypal.me/AntoninChenot';
const REVOLUT_LINK = 'https://revolut.me/antoni7mcq';
const IBAN = 'FR76 2823 3000 0199 9815 8391 677';
const NO_NOTE_TEXT = '❗❗ Ne mettre aucune note lors du paiement ❗❗';

let wallets = fs.existsSync('wallets.json')
  ? JSON.parse(fs.readFileSync('wallets.json'))
  : {};

let requests = fs.existsSync('requests.json')
  ? JSON.parse(fs.readFileSync('requests.json'))
  : { counter: 0, tickets: {} };

const pendingRecharges = new Map();

function saveWallets() {
  fs.writeFileSync('wallets.json', JSON.stringify(wallets, null, 2));
}

function saveRequests() {
  fs.writeFileSync('requests.json', JSON.stringify(requests, null, 2));
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

client.once('ready', () => {
  console.log('Bot connecte');
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

      return deleteLater(reply);
    }
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
      .setTitle('🎫 Support')
      .setDescription([
        '📩 Besoin d’aide ou une question sur une commande ?',
        '',
        'Clique sur le bouton ci-dessous pour ouvrir un ticket support.',
        '👥 Un membre du staff te répondra dès que possible.'
      ].join('\n'))
      .setFooter({ text: 'Support • Boutique' });

    const supportRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('open_support_ticket')
        .setLabel('Ouvrir un ticket')
        .setEmoji('🎫')
        .setStyle(ButtonStyle.Primary)
    );

    return message.channel.send({ embeds: [supportEmbed], components: [supportRow] });
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

      if (dmSent) {
        await message.channel.send('✅ Le ticket se fermera dans 10 secondes.');
        delete requests.tickets[message.channel.id];
        saveRequests();
        setTimeout(() => message.channel.delete().catch(() => {}), 10_000);
      }

      return;
    }

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
        permissionOverwrites: ticketPermissionOverwrites(interaction.guild, interaction.user.id)
      });

      const request = createRequest('support', ticket.id, interaction.user.id);
      await ticket.send({
        content: `🎫 Ticket support

🧾 Demande : #${request.id}
👤 Client : <@${interaction.user.id}>

📩 Explique ton problème ici.
👥 Un membre du staff va te répondre dès que possible.`,
        components: [ticketButtons(interaction.user.id)]
      });

      return replyTemp(interaction, {
        content: `✅ Ticket support créé : ${ticket}\n🧾 Demande : #${request.id}`,
        ephemeral: true
      });
    }

    if (interaction.customId === 'wallet') {
      if (!wallets[interaction.user.id]) wallets[interaction.user.id] = { balance: 0 };
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
      return replyTemp(interaction, { embeds: [infoEmbed], ephemeral: true }, 30_000);
    }

    if (interaction.customId === 'recharger') {
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

    return replyTemp(interaction, {
      content: `✅ Commande envoyée au staff.\n🧾 Demande : #${request.id}`,
      ephemeral: true
    });
  }
});

client.login(process.env.DISCORD_TOKEN);
