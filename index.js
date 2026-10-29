const { Client, GatewayIntentBits, Partials, Collection, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits } = require('discord.js');
const express = require('express');

// ==========================================
// 1. RENDER 7/24 UYKU ÖNLEYİCİ (EXPRESS)
// ==========================================
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Bot 7/24 Aktif ve Çalışıyor!');
});

app.listen(PORT, () => {
    console.log(`Web sunucusu ${PORT} portunda çalışıyor.`);
});

// ==========================================
// 2. BOT CLIENT VE INTENTS AYARLARI
// ==========================================
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildInvites
    ],
    partials: [Partials.Channel, Partials.Message, Partials.User, Partials.GuildMember]
});

client.commands = new Collection();

// Küfür Filtresi (Kara Liste)
const kufurler = [
    "amk", "aq", "orospu", "o.ç.", "oc", "sik", "sikik", "sikerim", "siktim", 
    "piç", "anan", "orospucocugu", "yarrak", "göt", "götveren", 
    "amina", "amina koyim", "kahpe", "ibne", "salak", "oç"
];

const TICKET_KANAL_ID = process.env.TICKET_KANAL_ID || "1564274342299443210";
const GIRIS_CIKIS_KANAL_ID = process.env.GIRIS_CIKIS_KANAL_ID || "1564274316315594892";

client.once('ready', async () => {
    console.log(`${client.user.tag} başarıyla giriş yaptı!`);

    // Slash Komutlarını Kaydetme
    const commands = [
        {
            name: 'cekilis',
            description: 'Yeni bir çekiliş başlatır.',
            options: [
                {
                    name: 'odul',
                    type: 3, // String type
                    description: 'Çekiliş ödülü nedir?',
                    required: true
                },
                {
                    name: 'sure',
                    type: 4, // Integer type
                    description: 'Süre (Dakika cinsinden)',
                    required: true
                }
            ]
        },
        {
            name: 'sestop',
            description: 'Ses kanalındaki herkesin bağlantısını keser.'
        }
    ];

    await client.application.commands.set(commands);
    console.log('Komutlar başarıyla yüklendi!');

    // Otomatik Ticket Paneli Gönderme
    try {
        const kanal = await client.channels.fetch(TICKET_KANAL_ID);
        if (kanal) {
            const embed = new EmbedBuilder()
                .setTitle('Destek Merkezi')
                .setDescription('Bir sorunla karşılaştıysanız veya yardıma ihtiyacınız varsa aşağıdaki **"Destek Talebi Aç"** butonuna tıklayabilirsiniz.')
                .setColor(0x5865F2);

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('create_ticket')
                    .setLabel('Destek Talebi Aç')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🎫')
            );

            await kanal.send({ embeds: [embed], components: [row] });
            console.log('Otomatik Ticket Paneli Kanalda Yayınlandı!');
        }
    } catch (err) {
        console.error("Otomatik ticket paneli gönderilemedi:", err);
    }
});

// ==========================================
// 3. KÜFÜR ENGELLEME SİSTEMİ
// ==========================================
client.on('messageCreate', async (message) => {
    if (!message.guild || message.author.bot) return;

    const content = message.content.toLowerCase();
    const kufurVarMi = kufurler.some(kufur => content.includes(kufur));

    if (kufurVarMi) {
        try {
            await message.delete();
            const uyari = await message.channel.send(`Lütfen küfür etmeyin, bu sunucuda yasaktır! ${message.author}`);
            setTimeout(() => uyari.delete().catch(() => {}), 5000);
        } catch (err) {
            console.error("Küfür silinirken hata oluştu:", err);
        }
    }
});

// ==========================================
// 4. OTOROL VE GİRİŞ-ÇIKIŞ SİSTEMİ
// ==========================================
client.on('guildMemberAdd', async (member) => {
    // Otomatik Rol Verme
    const OTO_ROL_ID = 1564274286800273438;
    if (OTO_ROL_ID) {
        const rol = member.guild.roles.cache.get(OTO_ROL_ID);
        if (rol) {
            await member.roles.add(rol).catch(err => console.error("Otorol verilemedi:", err));
        }
    }

    // Giriş Log Mesajı (Normal)
    if (GIRIS_CIKIS_KANAL_ID && GIRIS_CIKIS_KANAL_ID !== "1564274316315594892") {
        try {
            const kanal = await member.guild.channels.fetch(GIRIS_CIKIS_KANAL_ID);
            if (kanal) {
                const embed = new EmbedBuilder()
                    .setTitle('Sunucuya Yeni Biri Katıldı!')
                    .setDescription(`Aramıza hoş geldin ${member}! İyi ki geldin.`)
                    .setColor(0x57F287)
                    .setTimestamp();
                await kanal.send({ embeds: [embed] });
            }
        } catch (err) {
            console.error("Giriş mesajı gönderilemedi:", err);
        }
    }
});

client.on('guildMemberRemove', async (member) => {
    // Çıkış Log Mesajı (Normal)
    if (GIRIS_CIKIS_KANAL_ID && GIRIS_CIKIS_KANAL_ID !== "GIRIS_CIKIS_KANAL_ID_BURAYA") {
        try {
            const kanal = await member.guild.channels.fetch(GIRIS_CIKIS_KANAL_ID);
            if (kanal) {
                const embed = new EmbedBuilder()
                    .setTitle('Bir Üye Ayrıldı')
                    .setDescription(`**${member.user.tag}** sunucudan ayrıldı.`)
                    .setColor(0xED4245)
                    .setTimestamp();
                await kanal.send({ embeds: [embed] });
            }
        } catch (err) {
            console.error("Çıkış mesajı gönderilemedi:", err);
        }
    }
});

// ==========================================
// 5. SLASH KOMUTLARI YÖNETİMİ (Çekiliş, Sestop)
// ==========================================
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName, options, guild, member } = interaction;

    if (commandName === 'cekilis') {
        if (!member.permissions.has(PermissionFlagsBits.ManageGuild)) {
            return interaction.reply({ content: 'Çekiliş başlatmak için yetkiniz yok.', ephemeral: true });
        }

        const odul = options.getString('odul');
        const sureDakika = options.getInteger('sure');
        const bitisZamanMs = Date.now() + (sureDakika * 60 * 1000);

        const embed = new EmbedBuilder()
            .setTitle('🎉 Çekiliş Başladı! 🎉')
            .setDescription(`Ödül: **${odul}**\n\nKatılmak için aşağıdaki butona tıklayın!\nBitiş: <t:${Math.floor(bitisZamanMs / 1000)}:R>`)
            .setColor(0xFEE75C);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('join_giveaway')
                .setLabel('Çekilişe Katıl')
                .setStyle(ButtonStyle.Success)
                .setEmoji('🎉')
        );

        const mesaj = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });
        
        const katilimcilar = new Set();
        const collector = mesaj.createMessageComponentCollector({ time: sureDakika * 60 * 1000 });

        collector.on('collect', async i => {
            if (katilimcilar.has(i.user.id)) {
                return i.reply({ content: 'Zaten bu çekilişe katıldınız!', ephemeral: true });
            }
            katilimcilar.add(i.user.id);
            await i.reply({ content: 'Çekilişe başarıyla katıldınız!', ephemeral: true });
        });

        collector.on('end', async () => {
            const dizi = Array.from(katilimcilar);
            if (dizi.length === 0) {
                return mesaj.edit({ content: 'Çekilişe kimse katılamadığı için iptal edilmiştir.', components: [] });
            }
            const kazananId = dizi[Math.floor(Math.random() * dizi.length)];
            await mesaj.edit({ content: `🎊 Çekiliş sona erdi! Kazanan: <@${kazananId}> Tebrikler!`, components: [] });
        });
    }

    if (commandName === 'sestop') {
        if (!member.permissions.has(PermissionFlagsBits.MoveMembers)) {
            return interaction.reply({ content: 'Ses kanallarını yönetme yetkiniz bulunmuyor.', ephemeral: true });
        }

        const kanal = member.voice.channel;
        if (!kanal) {
            return interaction.reply({ content: 'Önce bir ses kanalında olmalısınız.', ephemeral: true });
        }

        for (const [memberId, mem] of kanal.members) {
            await mem.voice.disconnect().catch(() => {});
        }

        return interaction.reply({ content: `${kanal.name} odasındaki herkesin bağlantısı kesildi.`, ephemeral: true });
    }
});

// ==========================================
// 6. GİZLİ TİCKET SİSTEMİ
// ==========================================
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'create_ticket') {
        const guild = interaction.guild;
        const user = interaction.user;

        let kategori = guild.channels.cache.find(c => c.name === 'DESTEK TALEPLERİ' && c.type === ChannelType.GuildCategory);
        
        if (!kategori) {
            kategori = await guild.channels.create({
                name: 'DESTEK TALEPLERİ',
                type: ChannelType.GuildCategory,
            });
        }

        const channel = await guild.channels.create({
            name: `ticket-${user.username}`,
            type: ChannelType.GuildText,
            parent: kategori.id,
            permissionOverwrites: [
                {
                    id: guild.roles.everyone.id,
                    deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                },
                {
                    id: user.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
                },
                {
                    id: client.user.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels],
                }
            ],
        });

        const embed = new EmbedBuilder()
            .setTitle('Destek Talebi')
            .setDescription('Yetkililer en kısa sürede sizinle ilgilenecektir. Bu kanal sadece sizinle yetkililer arasında özeldir. Kapatmak için aşağıdaki butonu kullanabilirsiniz.')
            .setColor(0x5865F2);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('close_ticket')
                .setLabel('Talebi Kapat')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('🔒')
        );

        await channel.send({ content: `<@${user.id}>`, embeds: [embed], components: [row] });
        return interaction.reply({ content: `Destek kanalınız oluşturuldu: ${channel}`, ephemeral: true });
    }

    if (interaction.customId === 'close_ticket') {
        const channel = interaction.channel;
        await interaction.reply({ content: 'Talep kapatılıyor, kanal birazdan silinecek...' });
        setTimeout(() => channel.delete().catch(() => {}), 3000);
    }
});

// Bot Giriş İşlemi
client.login(process.env.TOKEN);