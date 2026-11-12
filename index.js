import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState
} from 'baileys'

import P from 'pino'
import fs from 'fs'

const phoneNumber = '6285788995899'
const allowedSender = '6285788995899'

const customPairingCode = 'PLZZBOTS'

const menuImage = fs.readFileSync('background/background.jpg')

const logger = P({
  level: 'silent'
})

const grublink = [
  'https://chat.whatsapp.com/HLdApxoyOUM3LB79llFZxl',
  'https://chat.whatsapp.com/KjxwrHZkPcg0dnU6T7lQqK',
  'https://chat.whatsapp.com/GklkLMsKmKT7pVbXOZCEgr',
  'https://chat.whatsapp.com/FovNrzSJ3N7Ki5bUiX5l5f',
  'https://chat.whatsapp.com/GDn7BvouedP0vrsR0ke5mF',
  'https://chat.whatsapp.com/HbwODowenHP9MeFUsQaxbA',
  'https://chat.whatsapp.com/KF7zcv7v8t96sps5X4Hxrv',
  'https://chat.whatsapp.com/DMaMaZoBJSiGsiVq2Rh7If',
  'https://chat.whatsapp.com/FLrkCnMBrJs9nfnx7vwFwb',
  'https://chat.whatsapp.com/HCfIFDgi13n5eExcvyIcrr',
  'https://chat.whatsapp.com/Jrbyo6215lbLkd1xjuqCPl',
  'https://chat.whatsapp.com/BsqHI9S4A65GKPXy8N6Ugp'
]

const boldDigits = '𝟎𝟏𝟐𝟑𝟒𝟓𝟔𝟕𝟖𝟗'
const bn = (n) => String(n).split('').map((d) => boldDigits[d] ?? d).join('')

const footerText = '𝐏𝐥𝐮𝐳𝐳𝐛𝐨𝐭𝐬𝐕𝟏 - 𝐏𝐥𝐮𝐳𝐳 𝐩𝐞𝐫𝐬𝐨𝐧𝐚𝐥 𝐚𝐬𝐬𝐢𝐬𝐭𝐚𝐧𝐭'

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

    if (
      !state.creds.registered &&
      !pairingCodeRequested &&
      (connection === 'connecting' || qr)
    ) {
      pairingCodeRequested = true

      try {
        await new Promise((resolve) => setTimeout(resolve, 3000))

        const code = await sock.requestPairingCode(
          phoneNumber,
          customPairingCode
        )

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

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return

    for (const message of messages) {
      if (!message.message) continue

      const remoteJid = message.key.remoteJid || ''
      const senderJid = message.key.participant || remoteJid

      const senderNumber = senderJid.split('@')[0]
      if (!message.key.fromMe && senderNumber !== allowedSender) continue

      const jid = remoteJid

      const text =
        message.message.conversation ||
        message.message.extendedTextMessage?.text ||
        message.message.imageMessage?.caption ||
        message.message.videoMessage?.caption ||
        ''

      const input = text.trim()

      if (!input.startsWith('.')) continue

      const parts = input.slice(1).trim().split(/\s+/)
      const command = parts[0]?.toLowerCase()

      switch (command) {
        case 'menu':
          await sock.sendMessage(jid, {
             image: menuImage,
             caption: [
              '╭──⟡〔 ✦ 𝐏𝐥𝐮𝐳𝐳𝐛𝐨𝐭𝐬𝐕𝟏 ✦ 〕',
              '│',
              '│  𝐎𝐩𝐞𝐧 𝐦𝐞𝐧𝐮        : .𝐦𝐞𝐧𝐮',
              '│  𝐁𝐮𝐠 𝐦𝐞𝐧𝐮         : .𝐛𝐮𝐠𝐦𝐞𝐧𝐮',
              '│  𝐁𝐨𝐭 𝐬𝐭𝐚𝐭𝐮𝐬       : .𝐩𝐢𝐧𝐠',
              '│  𝐀𝐮𝐭𝐨 𝐣𝐨𝐢𝐧 𝐠𝐫𝐨𝐮𝐩  : .𝐣𝐨𝐢𝐧𝐠𝐫𝐮𝐛',
              '│',
              `│  ${footerText}`,
              '╰──⟡',
            ].join('\n')
          })
          break

        case 'ping':
          await sock.sendMessage(jid, {
            text: [
              '╭──⟡〔 ✦ 𝐏𝐥𝐮𝐳𝐳𝐛𝐨𝐭𝐬𝐕𝟏 ✦ 〕',
              '│',
              '│  𝐏𝐨𝐧𝐠! 𝐁𝐨𝐭 𝐢𝐬 𝐚𝐜𝐭𝐢𝐯𝐞 𝐚𝐧𝐝 𝐫𝐮𝐧𝐧𝐢𝐧𝐠 𝐧𝐨𝐫𝐦𝐚𝐥𝐥𝐲.',
              '│',
              `│  ${footerText}`,
              '╰──⟡',
            ].join('\n')
          })
          break

        case 'bugmenu':
          await sock.sendMessage(jid, {
            text: [
              '╭──⟡〔 ✦ 𝐏𝐥𝐮𝐳𝐳𝐛𝐨𝐭𝐬𝐕𝟏 ✦ 〕',
              '│',
              '│  𝐞𝐱𝐭𝐫𝐞𝐦𝐞 : .𝐞𝐱𝐭𝐫𝐞𝐦𝐞𝐛𝐮𝐠 +𝟔𝟐𝟖𝐱𝐱𝐱',
              '│  𝐡𝐚𝐫𝐝    : .𝐡𝐚𝐫𝐝𝐛𝐮𝐠 +𝟔𝟐𝟖𝐱𝐱𝐱',
              '│  𝐦𝐢𝐝     : .𝐦𝐢𝐝𝐛𝐮𝐠 +𝟔𝟐𝟖𝐱𝐱𝐱',
              '│  𝐥𝐨𝐰     : .𝐥𝐨𝐰𝐛𝐮𝐠 +𝟔𝟐𝟖𝐱𝐱𝐱',
              '│',
              `│  ${footerText}`,
              '╰──⟡',
            ].join('\n')
          })
          break

        case 'joingrub': {
          await sock.sendMessage(jid, {
            text: `𝐀𝐭𝐭𝐞𝐦𝐩𝐭𝐢𝐧𝐠 𝐭𝐨 𝐣𝐨𝐢𝐧 ${bn(grublink.length)} 𝐠𝐫𝐨𝐮𝐩𝐬, 𝐩𝐥𝐞𝐚𝐬𝐞 𝐰𝐚𝐢𝐭...`
          })

          let joined = 0
          let failed = 0

          for (const link of grublink) {
            try {
              const inviteCode = link.split('/').pop().split('?')[0]

              await sock.groupAcceptInvite(inviteCode)
              joined++
            } catch (error) {
              failed++
              console.error(
                `Failed to join group (${link}):`,
                error?.message || error
              )
            }

            await new Promise((resolve) => setTimeout(resolve, 2000))
          }

          await sock.sendMessage(jid, {
            text: [
              '╭──⟡〔 ✦ 𝐏𝐥𝐮𝐳𝐳𝐛𝐨𝐭𝐬𝐕𝟏 ✦ 〕',
              '│',
              `│  𝐒𝐮𝐜𝐜𝐞𝐬𝐬𝐟𝐮𝐥𝐥𝐲 𝐣𝐨𝐢𝐧𝐞𝐝 : ${bn(joined)} 𝐠𝐫𝐨𝐮𝐩𝐬`,
              `│  𝐅𝐚𝐢𝐥𝐞𝐝 𝐭𝐨 𝐣𝐨𝐢𝐧      : ${bn(failed)} 𝐠𝐫𝐨𝐮𝐩𝐬`,
              '│',
              `│  ${footerText}`,
              '╰──⟡',
            ].join('\n')
          })
          break
        }

        default:
          await sock.sendMessage(jid, {
            text: [
              '╭──⟡〔 ✦ 𝐏𝐥𝐮𝐳𝐳𝐛𝐨𝐭𝐬𝐕𝟏 ✦ 〕',
              '│',
              '│  𝐔𝐧𝐤𝐧𝐨𝐰𝐧 𝐜𝐨𝐦𝐦𝐚𝐧𝐝, 𝐭𝐲𝐩𝐞 .𝐦𝐞𝐧𝐮',
              '│',
              `│  ${footerText}`,
              '╰──⟡',
            ].join('\n')
          })
      }
    }
  })
}

startBot().catch((error) => {
  console.error('The bot failed to start:', error)
})
