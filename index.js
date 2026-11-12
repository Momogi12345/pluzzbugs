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

const botVersion = 'v1.0.0'

function formatWaktu() {
  const now = new Date()

  const datePart = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta'
  }).format(now)

  const timePart = new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta',
    hour12: false
  }).format(now)

  return `${datePart} | ${timePart} WIB`
}

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
      const t0 = Date.now()

      switch (command) {
        case 'menu':
          await sock.sendMessage(jid, {
             image: menuImage,
             caption: [
              '「 PLUZZBOTS MENU 」',
              '',
              '│ COMMAND',
              '│ Open menu       : .menu',
              '│ Bug menu        : .bugmenu',
              '│ Auto join group : .joingrub',
              '',
              '│ INFO',
              `│ Version : ${botVersion}`,
              `│ Ping    : ${Date.now() - t0}ms`,
              `│ Waktu   : ${formatWaktu()}`,
              '',
              'Pluzzbots MD'
            ].join('\n')
          })
          break

        case 'bugmenu':
          await sock.sendMessage(jid, {
            text: [
              '「 PLUZZBOTS BUG MENU 」',
              '',
              '│ COMMAND',
              '│ extreme : .extremebug +628xxx',
              '│ hard    : .hardbug +628xxx',
              '│ mid     : .midbug +628xxx',
              '',
              '│ INFO',
              `│ Version : ${botVersion}`,
              `│ Ping    : ${Date.now() - t0}ms`,
              `│ Waktu   : ${formatWaktu()}`,
              '',
              'Pluzzbots MD'
            ].join('\n')
          })
          break

        case 'joingrub': {
          await sock.sendMessage(jid, {
            text: `Attempting to join ${grublink.length} groups, please wait...`
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
              '「 PLUZZBOTS JOIN GRUP 」',
              '',
              '│ RESULT',
              `│ Successfully joined : ${joined} groups`,
              `│ Failed to join      : ${failed} groups`,
              '',
              '│ INFO',
              `│ Version : ${botVersion}`,
              `│ Ping    : ${Date.now() - t0}ms`,
              `│ Waktu   : ${formatWaktu()}`,
              '',
              'Pluzzbots MD'
            ].join('\n')
          })
          break
        }

        default:
          await sock.sendMessage(jid, {
            text: [
              '「 PLUZZBOTS 」',
              '',
              '│ ERROR',
              '│ Unknown command, type .menu',
              '│',
              '│ INFO',
              `│ Version : ${botVersion}`,
              `│ Ping    : ${Date.now() - t0}ms`,
              `│ Waktu   : ${formatWaktu()}`,
              '',
              'Pluzzbots MD'
            ].join('\n')
          })
      }
    }
  })
}

startBot().catch((error) => {
  console.error('The bot failed to start:', error)
})
