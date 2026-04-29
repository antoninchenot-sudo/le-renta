const fs=require('fs');
const {
Client,GatewayIntentBits,ActionRowBuilder,ButtonBuilder,ButtonStyle,
EmbedBuilder,Events,StringSelectMenuBuilder,ChannelType
}=require('discord.js');

const client=new Client({
intents:[
GatewayIntentBits.Guilds,
GatewayIntentBits.GuildMessages,
GatewayIntentBits.MessageContent
]
});

const ADMIN_ROLE_ID='1310984358991106120';
const TICKET_CATEGORY='1495800617204187216';

let wallets={};
if(fs.existsSync('wallets.json')){
wallets=JSON.parse(fs.readFileSync('wallets.json'));
}

function saveWallets(){
fs.writeFileSync('wallets.json',JSON.stringify(wallets,null,2));
}

const prices={
"50_74":2,"75_99":4,"100_124":6,"125_149":7,
"150_174":8,"175_199":10,"200_224":11,"225_249":12,
"250_274":13,"275_299":14,"300_324":15,"325_349":16,
"350_374":17,"400_499":18,"500_599":21
};

client.once('ready',()=>{
console.log("Bot connecte");
});

client.on('messageCreate',async message=>{

if(message.author.bot) return;

if(message.content==='!setup'){

const embed=new EmbedBuilder()
.setTitle('👑 Le Renta McDonalds')
.setDescription(`🔥 COMPTES DISPONIBLES 🔥

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

const row=new ActionRowBuilder().addComponents(
new ButtonBuilder().setCustomId('wallet').setLabel('👛 Portefeuille').setStyle(ButtonStyle.Primary),
new ButtonBuilder().setCustomId('recharger').setLabel('💳 Recharge de solde').setStyle(ButtonStyle.Secondary),
new ButtonBuilder().setCustomId('commande').setLabel('🎫 Commander').setStyle(ButtonStyle.Success)
);

message.channel.send({
content:'@everyone',
embeds:[embed],
components:[row]
});
}

});

client.on(Events.InteractionCreate,async interaction=>{

if(interaction.isButton()){

if(interaction.customId==='wallet'){
if(!wallets[interaction.user.id]) wallets[interaction.user.id]={balance:0};

return interaction.reply({
content:`💳 Solde actuel : ${wallets[interaction.user.id].balance.toFixed(2)}€`,
ephemeral:true
});
}

if(interaction.customId==='recharger'){

const payMenu=new ActionRowBuilder().addComponents(
new ButtonBuilder().setCustomId('paypal').setLabel('🅿️ PayPal').setStyle(ButtonStyle.Primary),
new ButtonBuilder().setCustomId('revolut').setLabel('💳 Revolut').setStyle(ButtonStyle.Success),
new ButtonBuilder().setCustomId('virement').setLabel('🏦 Virement').setStyle(ButtonStyle.Secondary)
);

return interaction.reply({
content:'💰 Menu Recharge de solde\nChoisissez un moyen de paiement :\n⚠️ Veuillez envoyer la preuve apres paiement.',
components:[payMenu],
ephemeral:true
});
}

if(interaction.customId==='paypal'){
const ticket=await interaction.guild.channels.create({
name:`recharge-${interaction.user.username}`,
parent:TICKET_CATEGORY,
type:ChannelType.GuildText
});

await ticket.send(`🅿️ Paiement PayPal :
https://paypal.me/Snackyy1

📌 Envoyez votre preuve de paiement ici.`);

return interaction.reply({
content:'✅ Ticket recharge cree.',
ephemeral:true
});
}

if(interaction.customId==='revolut'){
const ticket=await interaction.guild.channels.create({
name:`recharge-${interaction.user.username}`,
parent:TICKET_CATEGORY,
type:ChannelType.GuildText
});

await ticket.send(`💳 Paiement Revolut :
https://revolut.me/arthur23320/pocket/vNrIna0VcG

📌 Envoyez votre preuve de paiement ici.`);

return interaction.reply({
content:'✅ Ticket recharge cree.',
ephemeral:true
});
}

if(interaction.customId==='virement'){
const ticket=await interaction.guild.channels.create({
name:`recharge-${interaction.user.username}`,
parent:TICKET_CATEGORY,
type:ChannelType.GuildText
});

await ticket.send(`🏦 IBAN :
FR76 2823 3000 0176 1307 4771 273

Reference paiement : pseudo Discord

📌 Envoyez votre preuve de paiement ici.`);

return interaction.reply({
content:'✅ Ticket recharge cree.',
ephemeral:true
});
}

if(interaction.customId==='commande'){

const menu=new ActionRowBuilder().addComponents(
new StringSelectMenuBuilder()
.setCustomId('produits')
.setPlaceholder('🍔 Choisir un compte McDo...')
.addOptions([
{label:'50-74 points',value:'50_74'},
{label:'75-99 points',value:'75_99'},
{label:'100-124 points',value:'100_124'},
{label:'125-149 points',value:'125_149'},
{label:'150-174 points',value:'150_174'},
{label:'175-199 points',value:'175_199'},
{label:'200-224 points',value:'200_224'},
{label:'225-249 points',value:'225_249'},
{label:'250-274 points',value:'250_274'},
{label:'275-299 points',value:'275_299'},
{label:'300-324 points',value:'300_324'},
{label:'325-349 points',value:'325_349'},
{label:'350-374 points',value:'350_374'},
{label:'400-499 points',value:'400_499'},
{label:'500-599 points',value:'500_599'}
])
);

return interaction.reply({
content:'📦 Selectionnez votre compte :',
components:[menu],
ephemeral:true
});
}

}

if(interaction.isStringSelectMenu()){

const uid=interaction.user.id;
if(!wallets[uid]) wallets[uid]={balance:0};

const prix=prices[interaction.values[0]];

if(wallets[uid].balance<prix){
return interaction.reply({
content:'❌ Solde insuffisant',
ephemeral:true
});
}

wallets[uid].balance-=prix;
saveWallets();

const ticket=await interaction.guild.channels.create({
name:`commande-${interaction.user.username}`,
parent:TICKET_CATEGORY,
type:ChannelType.GuildText
});

await ticket.send(
`<@&${ADMIN_ROLE_ID}>

🎫 Nouvelle commande a traiter

👤 Client : <@${interaction.user.id}>
📦 Produit : ${interaction.values[0]}
💰 Paye : ${prix}€

📌 Un membre du staff doit envoyer le QR code au client.`
);

return interaction.reply({
content:'✅ Commande envoyee au staff.',
ephemeral:true
});
}

});

client.login(process.env.DISCORD_TOKEN);