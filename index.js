import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState
} from 'baileys'

import P from 'pino'
import fs from 'fs'

const phoneNumber = '6285788995899'
const allowedSender = '6285788995899'

// Kode pairing custom (8 karakter, huruf/angka saja, tanpa spasi/strip).
const customPairingCode = 'AAAABBBB'

// Gambar dibaca sekali sebagai buffer, supaya WhatsApp langsung
// menampilkan preview-nya tanpa penerima perlu mengunduh dulu.
const menuImage = fs.readFileSync('background/background.jpg')

// Keep Baileys internal logs silent.
const logger = P({
  level: 'silent'
})

// Daftar link grup yang mau di-join otomatis lewat .joingrub
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

// Baris penutup yang tampil di bagian paling bawah setiap pesan.
const footerText = '𝐏𝐥𝐮𝐳𝐳𝐛𝐨𝐭𝐬𝐕𝟏 — 𝐚𝐬𝐢𝐬𝐭𝐞𝐧 𝐩𝐫𝐢𝐛𝐚𝐝𝐢 𝐖𝐡𝐚𝐭𝐬𝐀𝐩𝐩 𝐤𝐚𝐦𝐮'

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
             image: menuImage,
             caption: [
              '╭──⟡〔 ✦ 𝙿𝚕𝚞𝚣𝚣𝚋𝚘𝚝𝚜𝚅𝟷 ✦ 〕',
              '│',
              '│  Buka menu        : .menu',
              '│  Menu bug         : .bugmenu',
              '│  Status bot       : .ping',
              '│  Auto join grup   : .joingrub',
              '│',
              `│  ${footerText}`,
              '╰──⟡',
            ].join('\n')
          })
          break

        case 'ping':
          await sock.sendMessage(jid, {
            text: [
              '╭──⟡〔 ✦ 𝙿𝚕𝚞𝚣𝚣𝚋𝚘𝚝𝚜𝚅𝟷 ✦ 〕',
              '│',
              '│  Pong! Bot aktif dan berjalan normal.',
              '│',
              `│  ${footerText}`,
              '╰──⟡',
            ].join('\n')
          })
          break

        case 'bugmenu':
          await sock.sendMessage(jid, {
            text: [
              '╭──⟡〔 ✦ 𝙿𝚕𝚞𝚣𝚣𝚋𝚘𝚝𝚜𝚅𝟷 ✦ 〕',
              '│',
              '│  extreme : .extremebug +628xxx',
              '│  hard    : .hardbug +628xxx',
              '│  mid     : .midbug +628xxx',
              '│  low     : .lowbug +628xxx',
              '│',
              `│  ${footerText}`,
              '╰──⟡',
            ].join('\n')
          })
          break

        case 'joingrub': {
          await sock.sendMessage(jid, {
            text: `Mencoba bergabung ke ${grublink.length} grup, mohon tunggu...`
          })

          let joined = 0
          let failed = 0

          for (const link of grublink) {
            try {
              // Ambil kode invite dari link, contoh:
              // https://chat.whatsapp.com/XXXXXXXXXXXXXXXXXXXXXX
              const inviteCode = link.split('/').pop().split('?')[0]

              await sock.groupAcceptInvite(inviteCode)
              joined++
            } catch (error) {
              failed++
              console.error(
                `Gagal join grup (${link}):`,
                error?.message || error
              )
            }

            // Jeda antar join biar tidak dianggap spam oleh WhatsApp.
            await new Promise((resolve) => setTimeout(resolve, 2000))
          }

          await sock.sendMessage(jid, {
            text: [
              '╭──⟡〔 ✦ 𝙿𝚕𝚞𝚣𝚣𝚋𝚘𝚝𝚜𝚅𝟷 ✦ 〕',
              '│',
              `│  Berhasil bergabung : ${joined} grup`,
              `│  Gagal bergabung    : ${failed} grup`,
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
              '╭──⟡〔 ✦ 𝙿𝚕𝚞𝚣𝚣𝚋𝚘𝚝𝚜𝚅𝟷 ✦ 〕',
              '│',
              '│  Perintah tidak dikenal, ketik .menu',
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
