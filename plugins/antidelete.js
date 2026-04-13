const fs = require('fs');
const path = require('path');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

const tempFolder = path.join(__dirname, '../temp');

// create temp folder
if (!fs.existsSync(tempFolder)) {
  fs.mkdirSync(tempFolder, { recursive: true });
}

// 🔥 clear old temp files on startup
fs.readdirSync(tempFolder).forEach(file => {
  try {
    fs.unlinkSync(path.join(tempFolder, file));
  } catch {}
});

const messageStore = new Map();
const mediaStore = new Map();

const CLEANUP_TIME = 10 * 60 * 1000; // 10 minutes

// unwrap ephemeral & viewOnce
function unwrapMessage(message) {
  if (!message) return null;

  if (message.ephemeralMessage) {
    return unwrapMessage(message.ephemeralMessage.message);
  }

  if (message.viewOnceMessageV2) {
    return unwrapMessage(message.viewOnceMessageV2.message);
  }

  if (message.viewOnceMessage) {
    return unwrapMessage(message.viewOnceMessage.message);
  }

  return message;
}

// get file extension
function getExtension(type, msg) {
  switch (type) {
    case 'imageMessage': return '.jpg';
    case 'videoMessage': return '.mp4';
    case 'audioMessage': return '.ogg';
    case 'stickerMessage': return '.webp';
    case 'documentMessage':
      return msg.documentMessage?.fileName
        ? path.extname(msg.documentMessage.fileName)
        : '.bin';
    default:
      return '.bin';
  }
}

module.exports = {
  name: 'antidelete',

  onMessage: async (conn, msg) => {
    try {
      if (!msg?.message || msg.key.fromMe) return;

      const keyId = msg.key.id;
      const remoteJid = msg.key.remoteJid;

      const cleanMessage = unwrapMessage(msg.message);
      if (!cleanMessage) return;

      // save message
      messageStore.set(keyId, {
        key: msg.key,
        message: cleanMessage,
        remoteJid
      });

      // 🔥 cleanup for ALL messages (FIXED)
      setTimeout(() => {
        messageStore.delete(keyId);

        if (mediaStore.has(keyId)) {
          try { fs.unlinkSync(mediaStore.get(keyId)); } catch {}
          mediaStore.delete(keyId);
        }
      }, CLEANUP_TIME);

      const type = Object.keys(cleanMessage)[0];
      if (!type) return;

      const mediaTypes = [
        'imageMessage',
        'videoMessage',
        'audioMessage',
        'stickerMessage',
        'documentMessage'
      ];

      if (!mediaTypes.includes(type)) return;

      const mediaMsg = cleanMessage[type];

      // 🔥 safe check (viewOnce fix)
      if (!mediaMsg?.url && !mediaMsg?.directPath) return;

      const stream = await downloadContentFromMessage(
        mediaMsg,
        type.replace('Message', '')
      );

      let buffer = Buffer.from([]);
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }

      if (!buffer.length) return;

      const ext = getExtension(type, cleanMessage);
      const filePath = path.join(tempFolder, `${keyId}${ext}`);

      await fs.promises.writeFile(filePath, buffer);
      mediaStore.set(keyId, filePath);

    } catch (err) {
      console.log('❌ AntiDelete onMessage error:', err.message);
    }
  },

  onDelete: async (conn, updates) => {
    try {
      for (const update of updates) {
        const key = update?.key;
        if (!key?.id) continue;

        // 🔥 improved delete detection
        const isDelete =
          update?.update?.message === null ||
          update?.update?.messageStubType === 1;

        if (!isDelete) continue;

        const keyId = key.id;
        const stored = messageStore.get(keyId);
        if (!stored) continue;

        const from = key.remoteJid;
        const sender = key.participant || from;

        const caption =
`🗑️ *Deleted Message Recovered*

👤 *Sender:* @${sender.split('@')[0]}
🕒 *Time:* ${new Date().toLocaleString()}`;

        const mediaPath = mediaStore.get(keyId);

        // 🔥 if media exists
        if (mediaPath && fs.existsSync(mediaPath)) {

          if (mediaPath.endsWith('.jpg')) {
            await conn.sendMessage(from, {
              image: { url: mediaPath },
              caption,
              mentions: [sender]
            });

          } else if (mediaPath.endsWith('.mp4')) {
            await conn.sendMessage(from, {
              video: { url: mediaPath },
              caption,
              mentions: [sender]
            });

          } else if (mediaPath.endsWith('.webp')) {
            await conn.sendMessage(from, {
              sticker: { url: mediaPath },
              contextInfo: { mentionedJid: [sender] }
            });

          } else if (mediaPath.endsWith('.ogg')) {
            await conn.sendMessage(from, {
              audio: { url: mediaPath },
              mimetype: 'audio/ogg; codecs=opus',
              contextInfo: { mentionedJid: [sender] }
            });

          } else {
            await conn.sendMessage(from, {
              document: { url: mediaPath },
              caption,
              mentions: [sender]
            });
          }

          continue;
        }

        // 🔥 text fallback
        const msgObj = stored.message;

        let text =
          msgObj.conversation ||
          msgObj.extendedTextMessage?.text ||
          msgObj.imageMessage?.caption ||
          msgObj.videoMessage?.caption ||
          msgObj.documentMessage?.caption ||
          '';

        await conn.sendMessage(from, {
          text: text
            ? `${caption}\n\n📝 *Message:* ${text}`
            : caption,
          mentions: [sender]
        });
      }

    } catch (err) {
      console.log('❌ AntiDelete onDelete error:', err.message);
    }
  }
};
