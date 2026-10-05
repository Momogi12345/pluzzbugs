import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState
} from 'baileys'

import P from 'pino'

const phoneNumber = '6285788995899'
const allowedSender = '6285788995899'

// Keep Baileys internal logs silent.
const logger = P({
  level: 'silent'
})

async function startBot() {
  const { state, saveCreds } =
    await useMultiFileAuthState('./auth_info')

  let pairingCodeRequested = false

  const sock = makeWASocket({
    auth: state,
    logger,
    printQRInTerminal: false
  })

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update

    // Request a pairing code only during the first login.
    if (
      !state.creds.registered &&
      !pairingCodeRequested &&
      (connection === 'connecting' || qr)
    ) {
      pairingCodeRequested = true

      try {
        // Give the WebSocket connection time to become ready.
        await new Promise((resolve) => setTimeout(resolve, 3000))

        const code = await sock.requestPairingCode(phoneNumber)

        console.log(`\nPairing code: ${code}`)
        console.log(
          'Open WhatsApp > Linked devices > Link a device > Link with phone number\n'
        )
      } catch (error) {
        pairingCodeRequested = false
        console.error(
          'Failed to request pairing code:',
          error?.message || error
        )
      }
    }

    if (connection === 'open') {
      console.log('Bot connected to WhatsApp successfully.')
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode

      if (statusCode === DisconnectReason.loggedOut) {
        console.error(
          'The session was logged out. Delete the auth_info folder and run the bot again.'
        )
        return
      }

      console.error(
        'The connection was closed. Reconnecting in 5 seconds...'
      )

      setTimeout(() => {
        startBot()
      }, 5000)
    }
  })

  // Save updated login credentials.
  sock.ev.on('creds.update', saveCreds)

  // Receive and process messages sent by the account owner, including
  // commands sent in private chats, the self-chat, and groups.
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return

    for (const message of messages) {
      if (!message.message) continue

      // For private chats use remoteJid; for groups use participant.
      const remoteJid = message.key.remoteJid || ''
      const senderJid = message.key.participant || remoteJid

      const senderNumber = senderJid.split('@')[0]
      // `fromMe` means the command was sent by the logged-in account.
      // This allows commands in the self-chat, private chats, and groups.
      // Incoming messages are still restricted to the allowed number.
      if (!message.key.fromMe && senderNumber !== allowedSender) continue

      const jid = remoteJid

      const text =
        message.message.conversation ||
        message.message.extendedTextMessage?.text ||
        message.message.imageMessage?.caption ||
        message.message.videoMessage?.caption ||
        ''

      const input = text.trim()

      // Only process commands that start with a dot.
      if (!input.startsWith('.')) continue

      const parts = input.slice(1).trim().split(/\s+/)
      const command = parts[0]?.toLowerCase()

      switch (command) {
        case 'menu':
          await sock.sendMessage(jid, {
             image: {
               url: 'background/background.jpg'
             },
             caption: [
              '╭┈┈⬡〔 ✦ PluzzbugsV1 ✦ 〕',
              '│',
              '│ 📖open the menu - .menu',
              '│ ☠️open bug menu - .bugmenu',
              '│ 📶bot status - .ping',
              '│',
              '╰┈┈┈┈┈┈⬡',
            ].join('\n')
          })
          break

        case 'ping':
          await sock.sendMessage(jid, {
            text: [
              '╭┈┈⬡〔 ✦ PluzzbugsV1 ✦ 〕',
              '│',
              '│ 🟢pong - termux teampekdelay',
              '│',
              '╰┈┈┈┈┈┈⬡',
            ].join('\n')
          })
          break

        case 'bugmenu':
          await sock.sendMessage(jid, {
            text: [
              '╭┈┈⬡〔 ✦ PluzzbugsV1 ✦ 〕',
              '│',
              '│ .extremebug - ☠️☠️Ex .extremebug +628',
              '│ .hardbug - ☠️Ex .hardbug +628',
              '│ .midbug - 💀💀Ex .midbug +628',
              '│ .lowbug - 💀Ex .lowbug +628',
              '│',
              '╰┈┈┈┈┈┈⬡',
            ].join('\n')
          })
          break

        default:
          await sock.sendMessage(jid, {
            text: [
              '╭┈┈⬡〔 ✦ PluzzbugsV1 ✦ 〕',
              '│',
              '│ ❌Unkown command - type .menu',
              '│',
              '╰┈┈┈┈┈┈⬡',
            ].join('\n')
          })
      }
    }
  })
}

startBot().catch((error) => {
  console.error('The bot failed to start:', error)
})
