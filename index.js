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

// --- KANAL, ROL VE KATEGORİ ID'LERİ ---
const TICKET_KANAL_ID = "1564274342299443210";       // Panelinin atılacağı kanal ID'si
const GIRIS_CIKIS_KANAL_ID = "1564274316315594892";           // Giriş çıkış log kanal ID'si
const PARTNER_KANAL_ID = "1564274339606564985"; // Onaylanan partnerliklerin gideceği kanal ID'si
const OTO_ROL_ID = "1564274286800273438";               // Otomatik verilecek rol ID'si
const TICKET_KATEGORI_ID = "1564274304160628808"; // Ticket'ların açılacağı ortak kategori ID'si

client.once('ready', async () => {
    console.log(`${client.user.tag} başarıyla giriş yaptı!`);

    const commands = [
        {
            name: 'cekilis',
            description: 'Yeni bir çekiliş başlatır.',
            options: [
                {
                    name: 'odul',
                    type: 3,
                    description: 'Çekiliş ödülü nedir?',
                    required: true
                },
                {
                    name: 'sure',
                    type: 4,
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

    // 5 Butonlu Otomatik Mor Ticket Paneli Gönderme
    try {
        const kanal = await client.channels.fetch(TICKET_KANAL_ID);
        if (kanal) {
            const embed = new EmbedBuilder()
                .setTitle('💜 Destek ve İletişim Merkezi')
                .setDescription('Aşağıdaki butonları kullanarak ihtiyacınıza uygun kategoride talep açabilirsiniz.\n\n' +
                    '👥 **Ekip Alım:** Ekibimize katılmak için\n' +
                    '🤝 **Partnerlik:** Partnerlik talepleri için\n' +
                    '🎫 **Genel Destek:** Sorun ve yardım talepleri için\n' +
                    '📢 **Reklam:** Reklam ve iş birliği için\n' +
                    '⚔️ **Ally/Merge:** Müttefiklik ve birleşme talepleri için')
                .setColor(0x9B59B6);

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('create_ekip').setLabel('Ekip Alım').setStyle(ButtonStyle.Primary).setEmoji('👥'),
                new ButtonBuilder().setCustomId('create_partner').setLabel('Partnerlik').setStyle(ButtonStyle.Secondary).setEmoji('🤝'),
                new ButtonBuilder().setCustomId('create_destek').setLabel('Genel Destek').setStyle(ButtonStyle.Success).setEmoji('🎫'),
                new ButtonBuilder().setCustomId('create_reklam').setLabel('Reklam').setStyle(ButtonStyle.Secondary).setEmoji('📢'),
                new ButtonBuilder().setCustomId('create_ally').setLabel('Ally/Merge').setStyle(ButtonStyle.Primary).setEmoji('⚔️')
            );

            await kanal.send({ embeds: [embed], components: [row] });
            console.log('5 Butonlu Mor Ticket Paneli Yayınlandı!');
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
    if (OTO_ROL_ID && OTO_ROL_ID !== "OTO_ROL_ID_BURAYA") {
        const rol = member.guild.roles.cache.get(OTO_ROL_ID);
        if (rol) {
            await member.roles.add(rol).catch(err => console.error("Otorol verilemedi:", err));
        }
    }

    if (GIRIS_CIKIS_KANAL_ID && GIRIS_CIKIS_KANAL_ID !== "GIRIS_CIKIS_KANAL_ID_BURAYA") {
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
// 5. SLASH KOMUTLARI (Çekiliş, Sestop)
// ==========================================
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName, options, member } = interaction;

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
            new ButtonBuilder().setCustomId('join_giveaway').setLabel('Çekilişe Katıl').setStyle(ButtonStyle.Success).setEmoji('🎉')
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
// 6. KATEGORİ ID İLE TİCKET, PARTNERLİK YÖNETİMİ
// ==========================================
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    const guild = interaction.guild;
    const user = interaction.user;
    const customId = interaction.customId;

    let talepTuru = "";
    let kanalOnek = "";

    if (customId === 'create_ekip') { talepTuru = 'Ekip Alım'; kanalOnek = 'ekip'; }
    else if (customId === 'create_partner') { talepTuru = 'Partnerlik'; kanalOnek = 'partner'; }
    else if (customId === 'create_destek') { talepTuru = 'Genel Destek'; kanalOnek = 'destek'; }
    else if (customId === 'create_reklam') { talepTuru = 'Reklam'; kanalOnek = 'reklam'; }
    else if (customId === 'create_ally') { talepTuru = 'Ally/Merge'; kanalOnek = 'ally'; }

    if (talepTuru !== "") {
        let parentId = null;

        // Eğer kategori ID yazıldıysa orayı kullan, yazılmadıysa isme göre bulur veya oluşturur
        if (TICKET_KATEGORI_ID && TICKET_KATEGORI_ID !== "TICKET_KATEGORI_ID_BURAYA") {
            parentId = TICKET_KATEGORI_ID;
        } else {
            let kategori = guild.channels.cache.find(c => c.name === 'DESTEK TALEPLERİ' && c.type === ChannelType.GuildCategory);
            if (!kategori) {
                kategori = await guild.channels.create({ name: 'DESTEK TALEPLERİ', type: ChannelType.GuildCategory });
            }
            parentId = kategori.id;
        }

        const channel = await guild.channels.create({
            name: `${kanalOnek}-${user.username}`,
            type: ChannelType.GuildText,
            parent: parentId,
            permissionOverwrites: [
                { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
                { id: user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
                { id: client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels] }
            ],
        });

        const row = new ActionRowBuilder();
        if (customId === 'create_partner') {
            row.addComponents(
                new ButtonBuilder().setCustomId('approve_partner').setLabel('Onaylıyorum').setStyle(ButtonStyle.Success).setEmoji('✅'),
                new ButtonBuilder().setCustomId('close_ticket').setLabel('İptal Et / Kapat').setStyle(ButtonStyle.Danger).setEmoji('🔒')
            );
        } else {
            row.addComponents(
                new ButtonBuilder().setCustomId('close_ticket').setLabel('Talebi Kapat').setStyle(ButtonStyle.Danger).setEmoji('🔒')
            );
        }

        const embed = new EmbedBuilder()
            .setTitle(`💜 ${talepTuru} Talebi`)
            .setDescription(`Merhaba <@${user.id}>, yetkililerimiz en kısa sürede seninle ilgilenecektir.\n\n*Lütfen talebinizle ilgili detaylı bilgiyi buraya yazınız.*`)
            .setColor(0x9B59B6);

        await channel.send({ content: `<@${user.id}>`, embeds: [embed], components: [row] });
        return interaction.reply({ content: `Talebiniz başarıyla oluşturuldu: ${channel}`, ephemeral: true });
    }

    // --- PARTNERLİK ONAYLAMA SİSTEMİ ---
    if (customId === 'approve_partner') {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
            return interaction.reply({ content: 'Bu butonu yalnızca yetkililer kullanabilir!', ephemeral: true });
        }

        const channel = interaction.channel;
        const messages = await channel.messages.fetch({ limit: 10 });
        const partnerMesaji = messages.find(m => !m.author.bot);

        if (!partnerMesaji) {
            return interaction.reply({ content: 'Kanalda gönderilmiş bir partnerlik metni bulunamadı! Lütfen önce metni kanala yazın.', ephemeral: true });
        }

        if (PARTNER_KANAL_ID && PARTNER_KANAL_ID !== "PARTNER_OG_KANAL_ID_BURAYA") {
            try {
                const partnerKanal = await guild.channels.fetch(PARTNER_KANAL_ID);
                if (partnerKanal) {
                    await partnerKanal.send(`📢 **Yeni Bir Partnerlik!**\n\n${partnerMesaji.content}`);
                }
            } catch (err) {
                console.error("Partner kanalına mesaj atılamadı:", err);
            }
        }

        await interaction.reply({ content: 'Partnerlik onaylandı ve belirlenen partner kanalına gönderildi! Kanal 3 saniye içinde kapatılıyor...' });
        setTimeout(() => channel.delete().catch(() => {}), 3000);
    }

    // --- TALEP KAPATMA ---
    if (customId === 'close_ticket') {
        const channel = interaction.channel;
        await interaction.reply({ content: 'Talep kapatılıyor, kanal 3 saniye içinde silinecek...' });
        setTimeout(() => channel.delete().catch(() => {}), 3000);
    }
});

// Bot Giriş İşlemi
client.login(process.env.TOKEN);