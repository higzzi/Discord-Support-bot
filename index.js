const { Client, Intents, MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const fs = require('fs');
const path = require('path');

const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_VOICE_STATES,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS
    ],
});

const { channelID: channelIdToJoin, textChannelID, supportRoleID, categoryID, token, timeout, mp3File } = require('./config.json');
const mp3FilePath = path.resolve(__dirname, mp3File);

const lastInteractions = new Map();
let isPlaying = false;

async function joinVoiceChannelAndPlay() {
    try {
        const channel = client.channels.cache.get(channelIdToJoin);
        if (!channel || channel.type !== 'GUILD_VOICE') {
            console.error('🚨 Invalid voice channel ID or the bot cannot find the channel.');
            return null;
        }

        const connection = joinVoiceChannel({
            channelId: channelIdToJoin,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
        });

        connection.on('error', (error) => {
            console.error('❗ Voice connection error:', error);
        });

        // Check if file exists
        if (!fs.existsSync(mp3FilePath)) {
            console.error('❌ MP3 file not found:', mp3FilePath);
            return;
        }

        // Create an audio player
        const player = createAudioPlayer();
        const resource = createAudioResource(fs.createReadStream(mp3FilePath));
        player.play(resource);

        // Subscribe the player to the connection
        connection.subscribe(player);

        // When the audio finishes, disconnect the bot
        player.on(AudioPlayerStatus.Idle, () => {
            console.log('🎶 MP3 file finished playing.');
            connection.destroy(); // Leave the channel when done
            isPlaying = false;
        });

        player.on('error', (error) => {
            console.error('❗ Audio player error:', error);
        });

        isPlaying = true;
        return connection;
    } catch (error) {
        console.error('❌ Failed to join voice channel and play audio:', error);
        return null;
    }
}

client.once('ready', async () => {
    console.log(`
    ██████╗ ███████╗ █████╗ ████████╗██╗  ██╗    ██████╗  ██████╗ ██╗    ██╗
    ██╔══██╗██╔════╝██╔══██╗╚══██╔══╝██║  ██║    ██╔══██╗██╔═══██╗██║    ██║
    ██║  ██║█████╗  ███████║   ██║   ███████║    ██████╔╝██║   ██║██║ █╗ ██║
    ██║  ██║██╔══╝  ██╔══██║   ██║   ██╔══██║    ██╔══██╗██║   ██║██║███╗██║
    ██████╔╝███████╗██║  ██║   ██║   ██║  ██║    ██║  ██║╚██████╔╝╚███╔███╔╝
    ╚═════╝ ╚══════╝╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝    ╚═╝  ╚═╝ ╚═════╝  ╚══╝╚══╝ 
    `);
    console.log(' I am ready!');
    console.log(' Bot By Deathrow');
    

    client.on('voiceStateUpdate', async (oldState, newState) => {
        const oldChannel = oldState.channel;
        const newChannel = newState.channel;

        if (newState.member.user.bot) {
            return;
        }

        if (newChannel && newChannel.id === channelIdToJoin) {
            const textChannel = client.channels.cache.get(textChannelID);
            if (textChannel) {
                textChannel.send(`<@&${supportRoleID}> : ${newState.member.user} is waiting for technical support. 🚨`);
                textChannel.send(`<@&${supportRoleID}> : ${newState.member.user} في انتظار الدعم الفني. 🚨`);
            }

            let userCount = 0;
            const categoryChannels = newState.guild.channels.cache.filter(channel => channel.type === 'GUILD_VOICE' && channel.parentId === categoryID);
            categoryChannels.forEach(channel => {
                userCount += channel.members.size;
            });

            const embedEnglish = new MessageEmbed()
                .setColor('#0099ff')
                .setTitle('❓ Need Help?')
                .setDescription('If you need assistance, our support team is here to help! 💡')
                .addFields(
                    { name: '🔊 Currently available support team members', value: `**${userCount}** people.`, inline: false },
                    { name: '👈 How to get help?', value: 'Click the button below to notify our support team. They will be with you shortly! ⏳', inline: false }
                )
                .setFooter({ text: 'Support Bot' });

            const embedArabic = new MessageEmbed()
                .setColor('#0099ff')
                .setTitle('❓ هل تحتاج مساعدة؟')
                .setDescription('إذا كنت بحاجة إلى مساعدة، فإن فريق الدعم لدينا هنا للمساعدة! 💡')
                .addFields(
                    { name: '🔊 عدد أعضاء فريق الدعم المتاحين حاليًا', value: `**${userCount}** شخصًا.`, inline: false },
                    { name: '👈 كيفية الحصول على المساعدة؟', value: 'اضغط على الزر أدناه لإخطار فريق الدعم لدينا. سيقومون بمساعدتك قريبًا! ⏳', inline: false }
                )
                .setFooter({ text: 'بوت الدعم' });

            try {
                await newState.member.send({ 
                    embeds: [embedEnglish], 
                    components: [
                        new MessageActionRow().addComponents(
                            new MessageButton()
                                .setCustomId('support_button')
                                .setLabel('Notify Support 🆘')
                                .setStyle('PRIMARY')
                        )
                    ] 
                });

                await newState.member.send({
                    embeds: [embedArabic],
                    components: [
                        new MessageActionRow().addComponents(
                            new MessageButton()
                                .setCustomId('support_button')
                                .setLabel('إخطار الدعم 🆘')
                                .setStyle('PRIMARY')
                        )
                    ]
                });
            } catch (error) {
                console.error('❌ Could not send message to user:', error);
            }

            if (isPlaying) return;

            setTimeout(async () => {
                await joinVoiceChannelAndPlay();
            }, 1000 * timeout);
        }
    });

    client.on('interactionCreate', async interaction => {
        if (!interaction.isButton()) return;

        if (interaction.customId === 'support_button') {
            const currentTime = Date.now();
            const cooldownAmount = 3 * 60 * 1000; // 3 minutes cooldown

            if (lastInteractions.has(interaction.user.id)) {
                const lastInteractionTime = lastInteractions.get(interaction.user.id);
                const timePassed = currentTime - lastInteractionTime;

                if (timePassed < cooldownAmount) {
                    const timeLeft = (cooldownAmount - timePassed) / 1000;
                    await interaction.reply({ 
                        content: `🕒 Please wait ${timeLeft.toFixed(1)} seconds before notifying the support team again.`, 
                        ephemeral: true 
                    });
                    await interaction.reply({
                        content: `🕒 من فضلك انتظر ${timeLeft.toFixed(1)} ثانية قبل إخطار فريق الدعم مرة أخرى.`,
                        ephemeral: true
                    });
                    return;
                }
            }

            lastInteractions.set(interaction.user.id, currentTime);

            const textChannel = client.channels.cache.get(textChannelID);
            if (textChannel) {
                textChannel.send(`<@&${supportRoleID}>: ${interaction.user} has sent a notification to the support team. 📩`);
                textChannel.send(`<@&${supportRoleID}>: ${interaction.user} أرسل إشعارًا إلى فريق الدعم. 📩`);
            }
            await interaction.reply({ content: '✅ A support notification has been sent!', ephemeral: true });
            await interaction.reply({
                content: '✅ تم إرسال إشعار الدعم!',
                ephemeral: true
            });
        }
    });
});

client.login(token);
