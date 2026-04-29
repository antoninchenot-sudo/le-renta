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
  PermissionFlagsBits
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const ADMIN_ROLE_ID = '1310984358991106120';
const STAFF_ROLE_ID = '1310342652058800138';
const TICKET_CATEGORY = '1495800617204187216';
const DELETE_DELAY = 10_000;

const SHOP_EMOJI = '<:4964mcdonalds:1498440076257136830>';
const INFO_IMAGE = 'https://images-ext-1.discordapp.net/external/PDwpqnH8rd9lL2CwVonbWngM9hLKFtpxOZ_da1iKy50/https/img.draftbot.fr/1776700160616-f67ef3f129b6a57b.png?format=webp&quality=lossless&width=623&height=944';

const PAYPAL_LINK = 'https://www.paypal.com/paypalme/AntoninChenot';
const REVOLUT_LINK = 'https://revolut.me/arthur23320/pocket/vNrIna0VcG';
const IBAN = 'FR76 2823 3000 0176 1307 4771 273';
const NO_NOTE_TEXT = '❗❗ Ne mettre aucune note lors du paiement ❗❗';

let wallets = {};
if (fs.existsSync('wallets.json')) {
  wallets = JSON.parse(fs.readFileSync('wallets.json'));
}

let requests = { counter: 0, tickets: {} };
if (fs.existsSync('requests.json')) {
  requests = JSON.parse(fs.readFileSync('requests.json'));
}

function saveWallets() {
  fs.writeFileSync('wallets.json', JSON.stringify(wallets, null, 2));
}

function saveRequests() {
  fs.writeFileSync('requests.json', JSON.stringify(requests, null, 2));
}

function createRequest(type, channelId, userId, data = {}) {
  requests.counter += 1;

  const prefix = type === 'recharge' ? 'R' : 'C';
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

const products = [
  { label: '50-74 points', description: '2€', value: '50_74', price: 2 },
  { label: '75-99 points', description: '4€', value: '75_99', price: 4 },
  { label: '100-124 points', description: '6€', value: '100_124', price: 6 },
  { label: '125-149 points', description: '7€', value: '125_149', price: 7 },
  { label: '150-174 points', description: '8€', value: '150_174', price: 8 },
  { label: '175-199 points', description: '10€', value: '175_199', price: 10 },
  { label: '200-224 points', description: '11€', value: '200_224', price: 11 },
  { label: '225-249 points', description: '12€', value: '225_249', price: 12 },
  { label: '250-274 points', description: '13€', value: '250_274', price: 13 },
  { label: '275-299 points', description: '14€', value: '275_299', price: 14 },
  { label: '300-324 points', description: '15€', value: '300_324', price: 15 },
  { label: '325-349 points', description: '16€', value: '325_349', price: 16 },
  { label: '350-374 points', description: '17€', value: '350_374', price: 17 },
  { label: '400-499 points', description: '18€', value: '400_499', price: 18 },
  { label: '500-599 points', description: '21€', value: '500_599', price: 21 }
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

  if (!Number.isFinite(amount) || amount < 1 || amount > 200) {
    return null;
  }

  return Math.round(amount * 100);
}

function formatAmount(cents) {
  return `${(cents / 100).toFixed(2)}€`;
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
  if (!message.guild) return;

  if (message.content === '!setup') {
    const embed = new EmbedBuilder()
      .setColor(0xD4AF37)
      .setAuthor({
        name: 'Le Renta McDonalds',
        iconURL: message.guild.iconURL({ dynamic: true })
      })
      .setTitle(`Tarifs points MCDO ${SHOP_EMOJI}`)
      .setDescription([
        'Pour commander, recharge d’abord ton solde avec le bouton ci-dessous.',
        '',
        'Moyens de paiement disponibles :',
        '',
        '🅿️ PayPal',
        '💳 Revolut',
        '🏦 Virement bancaire',
        '',
        '```',
        productListText(),
        '```',
        '',
        'Une fois ton solde rechargé, clique sur Commander.'
      ].join('\n'))
      .setThumbnail(message.guild.iconURL({ dynamic: true }))
      .setFooter({ text: 'Portefeuille • Recharge • Commande' });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('wallet')
        .setLabel('Portefeuille')
        .setEmoji('👛')
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId('recharger')
        .setLabel('Recharger le solde')
        .setEmoji('➕')
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId('commande')
        .setLabel('Commander')
        .setEmoji('🎫')
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId('infos_points')
        .setLabel('Programme fidélité McDo')
        .setEmoji('ℹ️')
        .setStyle(ButtonStyle.Secondary)
    );

    return message.channel.send({
      embeds: [embed],
      components: [row]
    });
  }

  if (message.content === '!tarifs') {
    message.delete().catch(() => {});

    const embed = new EmbedBuilder()
      .setColor(0xD4AF37)
      .setAuthor({
        name: 'Le Renta McDonalds',
        iconURL: message.guild.iconURL({ dynamic: true })
      })
      .setTitle(`Tarifs points MCDO ${SHOP_EMOJI}`)
      .setDescription([
        'Voici la grille des tarifs disponibles selon le nombre de points.',
        'Pour commander, recharge ton solde puis utilise le bouton **Commander** sur la boutique.',
        '',
        '```',
        productListText(),
        '```'
      ].join('\n'))
      .setThumbnail(message.guild.iconURL({ dynamic: true }))
      .setFooter({ text: 'Tarifs points MCDO • Solde obligatoire avant commande' });

    return message.channel.send({
      embeds: [embed]
    });
  }

  if (message.content.startsWith('!addmoney')) {
    message.delete().catch(() => {});

    const isAdmin =
      message.member.roles.cache.has(ADMIN_ROLE_ID) ||
      message.member.permissions.has(PermissionFlagsBits.Administrator);

    if (!isAdmin) {
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
      const dmEmbed = new EmbedBuilder()
        .setColor(0x2ECC71)
        .setTitle('✅ Recharge validée')
        .setDescription([
          'Ta recharge a été validée avec succès.',
          '',
          `🧾 Demande : #${ticketRequest.id}`,
          `💰 Montant ajouté : **${amount}€**`,
          `👤 Pris en charge par : **${message.author.tag}**`,
          '',
          'Ton solde est maintenant disponible sur la boutique.'
        ].join('\n'));

      let dmSent = false;

      await user.send({ embeds: [dmEmbed] })
        .then(() => {
          dmSent = true;
        })
        .catch(async () => {
          const warn = await message.channel.send('⚠️ Impossible d’envoyer un MP au client. Le ticket reste ouvert.');
          deleteLater(warn);
        });

      const successEmbed = new EmbedBuilder()
        .setColor(0x2ECC71)
        .setTitle('✅ Solde ajouté')
        .setDescription([
          `**${amount}€** ont été ajoutés au portefeuille de ${user}.`,
          `🧾 Demande : #${ticketRequest.id}`,
          dmSent ? '📩 MP envoyé au client.' : '⚠️ MP non envoyé au client.'
        ].join('\n'));

      await message.channel.send({ embeds: [successEmbed] });

      if (dmSent) {
        await message.channel.send('✅ Le ticket se fermera dans 10 secondes.');

        if (requests.tickets[message.channel.id]) {
          delete requests.tickets[message.channel.id];
          saveRequests();
        }

        setTimeout(() => {
          message.channel.delete().catch(() => {});
        }, 10_000);
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
    message.delete().catch(() => {});

    const isAdmin =
      message.member.roles.cache.has(ADMIN_ROLE_ID) ||
      message.member.permissions.has(PermissionFlagsBits.Administrator);

    if (!isAdmin) {
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
        return interaction.reply({
          content: '❌ Tu ne peux pas supprimer ce ticket.',
          ephemeral: true
        });
      }

      const confirmRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`confirm_delete_ticket:${ownerId}`)
          .setLabel('Confirmer')
          .setEmoji('✅')
          .setStyle(ButtonStyle.Danger),

        new ButtonBuilder()
          .setCustomId('cancel_delete_ticket')
          .setLabel('Annuler')
          .setEmoji('❌')
          .setStyle(ButtonStyle.Secondary)
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
        return interaction.reply({
          content: '❌ Tu ne peux pas supprimer ce ticket.',
          ephemeral: true
        });
      }

      if (requests.tickets[interaction.channel.id]) {
        delete requests.tickets[interaction.channel.id];
        saveRequests();
      }

      await interaction.reply({
        content: '🗑️ Ticket supprimé dans 5 secondes...',
        ephemeral: true
      });

      setTimeout(() => {
        interaction.channel.delete().catch(() => {});
      }, 5000);

      return;
    }

    if (interaction.customId === 'cancel_delete_ticket') {
      return interaction.update({
        content: '✅ Suppression annulée.',
        components: []
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
        .setTitle('Programme fidélité McDo+')
        .setImage(INFO_IMAGE);

      return replyTemp(interaction, {
        embeds: [infoEmbed],
        ephemeral: true
      }, 30_000);
    }

    if (interaction.customId === 'recharger') {
      const modal = new ModalBuilder()
        .setCustomId('recharge_amount')
        .setTitle('Recharge de solde');

      const amountInput = new TextInputBuilder()
        .setCustomId('amount')
        .setLabel('Montant entre 1€ et 200€')
        .setPlaceholder('Exemple : 10')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMinLength(1)
        .setMaxLength(6);

      modal.addComponents(
        new ActionRowBuilder().addComponents(amountInput)
      );

      return interaction.showModal(modal);
    }

    if (interaction.customId === 'commande') {
      const orderEmbed = new EmbedBuilder()
        .setColor(0xD4AF37)
        .setTitle('🎫 Fenêtre de commande')
        .setDescription([
          'Choisis ton produit dans le menu ci-dessous.',
          '',
          '```',
          productListText(),
          '```'
        ].join('\n'))
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

      return replyTemp(interaction, {
        embeds: [orderEmbed],
        components: [menu],
        ephemeral: true
      });
    }
  }

  if (interaction.isModalSubmit()) {
    if (interaction.customId === 'recharge_amount') {
      const cents = parseAmountToCents(interaction.fields.getTextInputValue('amount'));

      if (cents === null) {
        return replyTemp(interaction, {
          content: '❌ Montant invalide. Entrez un montant entre 1€ et 200€.',
          ephemeral: true
        });
      }

      const paymentMenu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(`payment_method:${cents}`)
          .setPlaceholder('💳 Choisir un moyen de paiement...')
          .addOptions([
            {
              label: 'PayPal',
              description: `Recharge de ${formatAmount(cents)}`,
              value: 'paypal',
              emoji: '🅿️'
            },
            {
              label: 'Revolut',
              description: `Recharge de ${formatAmount(cents)}`,
              value: 'revolut',
              emoji: '💳'
            },
            {
              label: 'Virement bancaire',
              description: `Recharge de ${formatAmount(cents)}`,
              value: 'virement',
              emoji: '🏦'
            }
          ])
      );

      return replyTemp(interaction, {
        content: `💰 Montant choisi : ${formatAmount(cents)}\nChoisissez un moyen de paiement :`,
        components: [paymentMenu],
        ephemeral: true
      });
    }
  }

  if (interaction.isStringSelectMenu()) {
    if (interaction.customId.startsWith('payment_method:')) {
      const cents = Number(interaction.customId.split(':')[1]);
      const method = interaction.values[0];
      const amount = formatAmount(cents);

      const ticket = await interaction.guild.channels.create({
        name: `recharge-${sanitizeChannelName(interaction.user.username)}`,
        parent: TICKET_CATEGORY,
        type: ChannelType.GuildText,
        permissionOverwrites: ticketPermissionOverwrites(interaction.guild, interaction.user.id)
      });

      const request = createRequest('recharge', ticket.id, interaction.user.id, {
        amount,
        method
      });

      let paymentText = '';

      if (method === 'paypal') {
        paymentText = `🅿️ Paiement PayPal : ${PAYPAL_LINK}

${NO_NOTE_TEXT}`;
      }

      if (method === 'revolut') {
        paymentText = `💳 Paiement Revolut : ${REVOLUT_LINK}

${NO_NOTE_TEXT}`;
      }

      if (method === 'virement') {
        paymentText = `🏦 Virement bancaire

IBAN : ${IBAN}

${NO_NOTE_TEXT}`;
      }

      await ticket.send({
        content: `🎫 Ticket recharge

🧾 Demande : #${request.id}
👤 Client : <@${interaction.user.id}>
💰 Montant : ${amount}
💳 Moyen de paiement : ${method}

${paymentText}`,
        components: [ticketButtons(interaction.user.id)]
      });

      return replyTemp(interaction, {
        content: `✅ Ticket recharge créé pour ${amount}.\n🧾 Demande : #${request.id}`,
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
      return replyTemp(interaction, {
        content: '❌ Produit introuvable.',
        ephemeral: true
      });
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
      parent: TICKET_CATEGORY,
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

📌 Envoyer le code barre au client.`,
      components: [ticketButtons(interaction.user.id)]
    });

    return replyTemp(interaction, {
      content: `✅ Commande envoyée au staff.\n🧾 Demande : #${request.id}`,
      ephemeral: true
    });
  }
});

client.login(process.env.DISCORD_TOKEN);
