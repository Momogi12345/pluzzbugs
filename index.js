import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState
} from 'baileys'

import P from 'pino'
import fs from 'fs'

const phoneNumber = '6285788995899'
const allowedSender = '6285788995899'
const customPairingCode = 'PLZZBOTS'
const botVersion = 'v1.0.0'
const footerText = 'Pluzzbots MD 🤖'

const menuThumbnailUrl =
  'https://raw.githubusercontent.com/Momogi12345/pluzzbugs/main/background/background.jpg'
const menuSourceUrl = 'https://github.com/Momogi12345/pluzzbugs'

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
  'https://chat.whatsapp.com/BsqHI9S4A65GKPXy8N6Ugp',
  'https://chat.whatsapp.com/CRlrXbfqfkEJKly1xkFXn8',
  'https://chat.whatsapp.com/EjpITZiDURCG6rmoV12Sw7',
  'https://chat.whatsapp.com/H4fcJ5N9PCXCkt5YmcuIbu',
  'https://chat.whatsapp.com/G9iQxaey17OKrBLvdZo16T',
  'https://chat.whatsapp.com/C4nCn2u3PUCIlm4wcLoIG5',
  'https://chat.whatsapp.com/Buo5ZA1UDTpJkw0NE6dg6Z',
  'https://chat.whatsapp.com/EB578aONGEAHGykRq8gEv5',
  'https://chat.whatsapp.com/KFgBdmPBEVYBBIVj80EA5c',
  'https://chat.whatsapp.com/C6to0pnp2LkAx7pZ2VRaip',
  'https://chat.whatsapp.com/5zdN5GsN2ufGfgdcz9ahtU',
  'https://chat.whatsapp.com/FXJCcgcFXlHC5GkvFEhwmG',
  'https://chat.whatsapp.com/J6iWgP19A1a0chq6aCVjjE',
  'https://chat.whatsapp.com/JtW7dg2peyi9aIN8CEG2VI',
  'https://chat.whatsapp.com/invite/C6zG8V46mYW26nn7j1stuf',
  'https://chat.whatsapp.com/invite/JtfptnAHICx45nIJt56qi6',
  'https://chat.whatsapp.com/invite/Bl5rbzrL2raC2T3JlmtrtR',
  'https://chat.whatsapp.com/invite/HMJhcBq7G7V2gnGEPIv8p1',
  'https://chat.whatsapp.com/invite/LiFPFFGq4abBfWQQtKW4Ok',
  'https://chat.whatsapp.com/invite/JXQmqpsErxe6wTq4UkzcFw',
  'https://chat.whatsapp.com/invite/GzpOHkPLDESBJCwHupMffY',
  'https://chat.whatsapp.com/invite/FogziwHqByKCr9EbNsb98j',
  'https://chat.whatsapp.com/IiukjbJGj8s1SzrY44N4DS',
  'https://chat.whatsapp.com/FyYrV6CkwSGLtNfbD9eK5S',
  'https://chat.whatsapp.com/BhGS5OidyOZ9bRut8aLphX',
  'https://chat.whatsapp.com/Jxq6p9DBlWeGPzgniwkXXe',
  'https://chat.whatsapp.com/FbL9NuT9PVrKpeayUxfsuO',
  'https://chat.whatsapp.com/Chgl9S6tIUD7zzaqtuXa6R',
  'https://chat.whatsapp.com/B4rTvnIG9hBCnbcuw5WTc2'
]

function formatWaktu() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Jakarta'
  }).formatToParts(new Date())

  const value = {}
  for (const part of parts) value[part.type] = part.value

  return `${value.day}.${value.month}.${value.year} | ${value.hour}.${value.minute}wib`
}

function buildInfoBlock(pingMs) {
  return [
    '📊 INFO',
    `  • Version : ${botVersion}`,
    `  • Ping    : ${pingMs}ms`,
    `  • Waktu   : ${formatWaktu()}`
  ]
}

function buildMenuAdReply(title, body) {
  return {
    externalAdReply: {
      title,
      body,
      thumbnailUrl: menuThumbnailUrl,
      sourceUrl: menuSourceUrl,
      mediaType: 1,
      renderLargerThumbnail: true,
      showAdAttribution: false
    }
  }
}

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_info')

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

        const code = await sock.requestPairingCode(phoneNumber, customPairingCode)

        console.log(`\nPairing code: ${code}`)
        console.log('Open WhatsApp > Linked devices > Link a device > Link with phone number\n')
      } catch (error) {
        pairingCodeRequested = false
        console.error('Failed to request pairing code:', error?.message || error)
      }
    }

    if (connection === 'open') {
      console.log('Bot connected to WhatsApp successfully.')
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode

      if (statusCode === DisconnectReason.loggedOut) {
        console.error('The session was logged out. Delete the auth_info folder and run the bot again.')
        return
      }

      console.error('The connection was closed. Reconnecting in 5 seconds...')
      setTimeout(() => startBot(), 5000)
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
        case 'menu': {
          const caption = [
            '「 PLUZZBOTS MENU 」',
            '',
            '📜 COMMAND',
            '  • Open menu       : .menu',
            '  • Bug menu        : .bugmenu',
            '  • Auto join group : .joingrub',
            '',
            ...buildInfoBlock(Date.now() - t0),
            '',
            footerText
          ].join('\n')

          await sock.sendMessage(jid, {
            text: caption,
            contextInfo: buildMenuAdReply('PluzzbotsV1', 'Official WhatsApp Assistant')
          })
          break
        }

        case 'bugmenu': {
          const text = [
            '「 PLUZZBOTS BUGMENU 」',
            '',
            '📜 COMMAND',
            '  • extreme : .extremebug +628xxx',
            '  • hard    : .hardbug +628xxx',
            '  • mid     : .midbug +628xxx',
            '',
            ...buildInfoBlock(Date.now() - t0),
            '',
            footerText
          ].join('\n')

          await sock.sendMessage(jid, {
            text,
            contextInfo: buildMenuAdReply('PluzzbotsV1', 'Bug Menu')
          })
          break
        }

        case 'joingrub': {
          await sock.sendMessage(jid, {
            text: `⏳ Attempting to join ${grublink.length} groups, please wait...`,
            contextInfo: buildMenuAdReply('PluzzbotsV1', 'Auto Join Group')
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
              console.error(`Failed to join group (${link}):`, error?.message || error)
            }

            await new Promise((resolve) => setTimeout(resolve, 2000))
          }

          const text = [
            '「 PLUZZBOTS JOINGRUB 」',
            '',
            '📋 RESULT',
            `  • Successfully joined : ${joined} groups`,
            `  • Failed to join      : ${failed} groups`,
            '',
            ...buildInfoBlock(Date.now() - t0),
            '',
            footerText
          ].join('\n')

          await sock.sendMessage(jid, {
            text,
            contextInfo: buildMenuAdReply('PluzzbotsV1', 'Join Grup Result')
          })
          break
        }

        default: {
          const text = [
            '「 PLUZZBOTS ERROR 」',
            '',
            '❌ ERROR',
            '  • Unknown command, type .menu',
            '',
            ...buildInfoBlock(Date.now() - t0),
            '',
            footerText
          ].join('\n')

          await sock.sendMessage(jid, {
            text,
            contextInfo: buildMenuAdReply('PluzzbotsV1', 'Error')
          })
        }
      }
    }
  })
}

startBot().catch((error) => {
  console.error('The bot failed to start:', error)
})
