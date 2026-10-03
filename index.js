import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState
} from 'baileys'

const phoneNumber = '6285788995899'
const allowedSender = '6285788995899'

async function startBot() {
  const { state, saveCreds } =
    await useMultiFileAuthState('./auth_info')

  let pairingCodeRequested = false

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false
  })

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update

    // Pairing code hanya diminta satu kali saat login pertama.
    if (
      !state.creds.registered &&
      !pairingCodeRequested &&
      (connection === 'connecting' || qr)
    ) {
      pairingCodeRequested = true

      try {
        // Beri waktu agar koneksi WebSocket siap.
        await new Promise((resolve) => setTimeout(resolve, 3000))

        const code = await sock.requestPairingCode(phoneNumber)

        console.log(`\nPairing code: ${code}`)
        console.log(
          'WhatsApp > Perangkat tertaut > Tautkan perangkat > Tautkan dengan nomor telepon\n'
        )
      } catch (error) {
        pairingCodeRequested = false
        console.error('Gagal meminta pairing code:', error?.message || error)
      }
    }

    if (connection === 'open') {
      console.log('Bot berhasil terhubung ke WhatsApp.')
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode

      if (statusCode === DisconnectReason.loggedOut) {
        console.error('Sesi logout. Hapus folder auth_info lalu jalankan ulang.')
        return
      }

      console.error('Koneksi terputus. Mencoba terhubung kembali dalam 5 detik...')

      setTimeout(() => {
        startBot()
      }, 5000)
    }
  })

  // Simpan credential login.
  sock.ev.on('creds.update', saveCreds)

  // Hanya memproses pesan dari nomor yang diizinkan.
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return

    for (const message of messages) {
      if (!message.message || message.key.fromMe) continue

      // Pada chat pribadi, pengirim ada di remoteJid.
      // Pada grup, pengirim sebenarnya ada di participant.
      const senderJid =
        message.key.participant || message.key.remoteJid || ''

      const senderNumber = senderJid.split('@')[0]

      // Pesan dari nomor lain diabaikan sepenuhnya tanpa console.log.
      if (senderNumber !== allowedSender) continue

      const jid = message.key.remoteJid

      const text =
        message.message.conversation ||
        message.message.extendedTextMessage?.text ||
        message.message.imageMessage?.caption ||
        message.message.videoMessage?.caption ||
        ''

      const input = text.trim()

      // Abaikan pesan yang bukan command.
      if (!input.startsWith('.')) continue

      const parts = input.slice(1).trim().split(/\s+/)
      const command = parts[0]?.toLowerCase()

      switch (command) {
        case 'menu':
          await sock.sendMessage(jid, {
            text: [
              '*╭───〔 BOT MENU 〕───╮*',
              '*│*',
              '*│*  *Perintah tersedia:*',
              '*│*  • *.menu* — tampilkan menu',
              '*│*  • *.ping* — cek koneksi bot',
              '*│*',
              '*╰──────────────────╯*',
              '',
              '_Ketik salah satu command di atas._'
            ].join('\n')
          })
          break

        case 'ping':
          await sock.sendMessage(jid, {
            text: [
              '*╭───〔 STATUS 〕───╮*',
              '*│*',
              '*│*  *Pong!*',
              '*│*  Bot aktif dan siap menerima pesan.',
              '*│*',
              '*╰────────────────╯*'
            ].join('\n')
          })
          break

        default:
          await sock.sendMessage(jid, {
            text: [
              '*Command tidak tersedia.*',
              '',
              'Ketik *.menu* untuk melihat command yang bisa digunakan.'
            ].join('\n')
          })
      }
    }
  })
}

startBot().catch((error) => {
  console.error('Bot gagal dijalankan:', error)
})