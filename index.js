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

let wallets = {};
if (fs.existsSync('wallets.json')) {
  wallets = JSON.parse(fs.readFileSync('wallets.json'));
}

function saveWallets() {
  fs.writeFileSync('wallets.json', JSON.stringify(wallets, null, 2));
}

const prices = {
  "50_74": 2,
  "75_99": 4,
  "100_124": 6,
  "125_149": 7,
  "150_174": 8,
  "175_199": 10,
  "200_224": 11,
  "225_249": 12,
  "250_274": 13,
  "275_299": 14,
  "300_324": 15,
  "325_349": 16,
  "350_374": 17,
  "400_499": 18,
  "500_599": 21
};

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

function sanitizeChannelName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 30) || 'client';
}

function parseAmountToCents(value) {
  const normalized = value.trim().replace(',', '.');
  const amount = Number(normalized);

  if (!Number.isFinite(amount) || amount < 1 || amount > 200) {
    return null;
  }

  return Math.round(amount * 100);
}

function formatAmount(cents) {
  return `${(cents / 100).toFixed(2)}€`;
}

client.once('ready', () => {
  console.log('Bot connecte');
});

client.on('messageCreate', async message => {
  if (message.author.bot) return;

  if (message.content === '!setup') {
    const embed = new EmbedBuilder()
      .setTitle('👑 Boutique')
      .setDescription(`🔥 PRODUITS DISPONIBLES 🔥

💰 50-74 pts -> 2€

💰 75-99 pts -> 4€

💰 100-124 pts -> 6€

💰 125-149 pts -> 7€

💰 150-174 pts -> 8€

💰 175-199 pts -> 10€

💰 200-224 pts -> 11€

💰 225-249 pts -> 12€

💰 250-274 pts -> 13€

💰 275-299 pts -> 14€

💰 300-324 pts -> 15€

💰 325-349 pts -> 16€

💰 350-374 pts -> 17€

💰 400-499 pts -> 18€

💰 500-599 pts -> 21€`)
      .setColor(0xD4AF37);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('wallet').setLabel('👛 Portefeuille').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('recharger').setLabel('➕ Recharge de solde').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('commande').setLabel('🎫 Commander').setStyle(ButtonStyle.Success)
    );

    message.channel.send({
      content: '@everyone',
      embeds: [embed],
      components: [row]
    });
  }

  if (message.content.startsWith('!addmoney')) {
    const args = message.content.split(' ');
    const user = message.mentions.users.first();
    const amount = parseFloat(args[2]);

    if (!wallets[user.id]) wallets[user.id] = { balance: 0 };
    wallets[user.id].balance += amount;
    saveWallets();

    message.reply(`${amount} euros ajoutes.`);
  }

  if (message.content.startsWith('!removemoney')) {
    const args = message.content.split(' ');
    const user = message.mentions.users.first();
    const amount = parseFloat(args[2]);

    if (!wallets[user.id]) wallets[user.id] = { balance: 0 };
    wallets[user.id].balance -= amount;
    saveWallets();

    message.reply(`${amount} euros retires.`);
  }
});

client.on(Events.InteractionCreate, async interaction => {
  if (interaction.isButton()) {
    if (interaction.customId === 'wallet') {
      if (!wallets[interaction.user.id]) wallets[interaction.user.id] = { balance: 0 };

      return interaction.reply({
        content: `💳 Solde actuel : ${wallets[interaction.user.id].balance.toFixed(2)}€`,
        ephemeral: true
      });
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

    const paymentMatch = interaction.customId.match(/^(paypal|revolut|virement):(\d+)$/);

    if (paymentMatch) {
      const method = paymentMatch[1];
      const cents = Number(paymentMatch[2]);
      const amount = formatAmount(cents);

      const ticket = await interaction.guild.channels.create({
        name: `recharge-${sanitizeChannelName(interaction.user.username)}`,
        parent: TICKET_CATEGORY,
        type: ChannelType.GuildText,
        permissionOverwrites: ticketPermissionOverwrites(interaction.guild, interaction.user.id)
      });

      let paymentText = '';

      if (method === 'paypal') {
        paymentText = '🅿️ Paiement PayPal : REMPLACE_PAR_TON_LIEN_PAYPAL';
      }

      if (method === 'revolut') {
        paymentText = '💳 Paiement Revolut : REMPLACE_PAR_TON_LIEN_REVOLUT';
      }

      if (method === 'virement') {
        paymentText = `🏦 IBAN : REMPLACE_PAR_TON_IBAN

Reference paiement : pseudo Discord`;
      }

      await ticket.send(`🎫 Ticket recharge

👤 Client : <@${interaction.user.id}>
💰 Montant : ${amount}
💳 Moyen de paiement : ${method}

${paymentText}`);

      return interaction.reply({
        content: `✅ Ticket recharge créé pour ${amount}.`,
        ephemeral: true
      });
    }

    if (interaction.customId === 'commande') {
      const menu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('produits')
          .setPlaceholder('🛒 Choisir un produit...')
          .addOptions([
            { label: '50-74 points', description: '2€', value: '50_74' },
            { label: '75-99 points', description: '4€', value: '75_99' },
            { label: '100-124 points', description: '6€', value: '100_124' },
            { label: '125-149 points', description: '7€', value: '125_149' },
            { label: '150-174 points', description: '8€', value: '150_174' },
            { label: '175-199 points', description: '10€', value: '175_199' },
            { label: '200-224 points', description: '11€', value: '200_224' },
            { label: '225-249 points', description: '12€', value: '225_249' },
            { label: '250-274 points', description: '13€', value: '250_274' },
            { label: '275-299 points', description: '14€', value: '275_299' },
            { label: '300-324 points', description: '15€', value: '300_324' },
            { label: '325-349 points', description: '16€', value: '325_349' },
            { label: '350-374 points', description: '17€', value: '350_374' },
            { label: '400-499 points', description: '18€', value: '400_499' },
            { label: '500-599 points', description: '21€', value: '500_599' }
          ])
      );

      return interaction.reply({
        content: '📦 Sélectionnez votre produit :',
        components: [menu],
        ephemeral: true
      });
    }
  }

  if (interaction.isModalSubmit()) {
    if (interaction.customId === 'recharge_amount') {
      const cents = parseAmountToCents(interaction.fields.getTextInputValue('amount'));

      if (cents === null) {
        return interaction.reply({
          content: '❌ Montant invalide. Entrez un montant entre 1€ et 200€.',
          ephemeral: true
        });
      }

      const payMenu = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`paypal:${cents}`).setLabel('🅿️ PayPal').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId(`revolut:${cents}`).setLabel('💳 Revolut').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`virement:${cents}`).setLabel('🏦 Virement').setStyle(ButtonStyle.Secondary)
      );

      return interaction.reply({
        content: `💰 Montant choisi : ${formatAmount(cents)}
Choisissez un moyen de paiement :`,
        components: [payMenu],
        ephemeral: true
      });
    }
  }

  if (interaction.isStringSelectMenu()) {
    const uid = interaction.user.id;
    if (!wallets[uid]) wallets[uid] = { balance: 0 };

    const prix = prices[interaction.values[0]];

    if (wallets[uid].balance < prix) {
      return interaction.reply({
        content: `❌ Solde insuffisant
💰 Prix : ${prix}€
👛 Solde : ${wallets[uid].balance}€`,
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

    await ticket.send(`<@&${STAFF_ROLE_ID}>

🎫 Nouvelle commande à traiter

👤 Client : <@${interaction.user.id}>
📦 Produit : ${interaction.values[0]}
💰 Payé : ${prix}€

📌 Traiter la commande avec le client.`);

    return interaction.reply({
      content: '✅ Commande envoyée au staff.',
      ephemeral: true
    });
  }
});

client.login(process.env.DISCORD_TOKEN);
