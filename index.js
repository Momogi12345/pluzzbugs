import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState
} from 'baileys'

const phoneNumber = '6285788995899'

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

    console.log('Status koneksi:', connection)

    /*
     * Jangan meminta pairing code saat connection === undefined.
     * Tunggu sampai connecting atau QR tersedia.
     */
    if (
      !state.creds.registered &&
      !pairingCodeRequested &&
      (connection === 'connecting' || qr)
    ) {
      pairingCodeRequested = true

      try {
        // Beri waktu agar koneksi WebSocket siap
        await new Promise((resolve) => setTimeout(resolve, 3000))

        const code = await sock.requestPairingCode(phoneNumber)

        console.log('')
        console.log('================================')
        console.log('PAIRING CODE:', code)
        console.log('================================')
        console.log('')
        console.log(
          'Buka WhatsApp > Perangkat tertaut > Tautkan perangkat > Tautkan dengan nomor telepon'
        )
      } catch (error) {
        pairingCodeRequested = false
        console.error(
          'Gagal meminta pairing code:',
          error?.message || error
        )
      }
    }

    if (connection === 'open') {
      console.log('Bot berhasil terhubung ke WhatsApp')
    }

    if (connection === 'close') {
      const statusCode =
        lastDisconnect?.error?.output?.statusCode

      console.log('Koneksi tertutup:', statusCode)

      if (statusCode === DisconnectReason.loggedOut) {
        console.log(
          'Sesi logout. Hapus folder auth_info lalu jalankan ulang.'
        )
        return
      }

      console.log('Mencoba terhubung kembali dalam 5 detik...')

      setTimeout(() => {
        startBot()
      }, 5000)
    }
  })

  // Simpan credential login
  sock.ev.on('creds.update', saveCreds)

  // Menerima pesan
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return

    for (const message of messages) {
      if (!message.message) continue
      if (message.key.fromMe) continue

      const jid = message.key.remoteJid

      const text =
        message.message.conversation ||
        message.message.extendedTextMessage?.text ||
        ''

      const command = text.toLowerCase().trim()

      console.log(`${jid}: ${text}`)

      if (command === 'ping') {
        await sock.sendMessage(jid, {
          text: 'pong'
        })
      }

      if (command === 'menu') {
        await sock.sendMessage(jid, {
          text: [
            '*Menu Bot*',
            '',
            '1. ping',
            '2. hard-bug',
            '3. mid-bug',
            '4. low-bug'
          ].join('\n')
        })
      }
    }
  })
}

startBot().catch((error) => {
  console.error('Bot gagal dijalankan:', error)
})
