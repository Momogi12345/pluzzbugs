import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState
} from 'baileys'

const phoneNumber = '6285788995899' // tanpa tanda + atau spasi

async function startBot() {
  const { state, saveCreds } =
    await useMultiFileAuthState('./auth_info')

  let pairingCodeRequested = false

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false
  })

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update

    // Minta pairing code hanya sekali pada proses koneksi awal
    if (
      (connection === 'connecting' || connection === undefined) &&
      !state.creds.registered &&
      !pairingCodeRequested
    ) {
      pairingCodeRequested = true

      try {
        const code = await sock.requestPairingCode(phoneNumber)

        console.log('')
        console.log('Pairing code WhatsApp kamu:')
        console.log(code)
        console.log('')
        console.log(
          'Buka WhatsApp > Perangkat tertaut > Tautkan perangkat > Tautkan dengan nomor telepon'
        )
      } catch (error) {
        pairingCodeRequested = false
        console.error('Gagal meminta pairing code:', error)
      }
    }

    if (connection === 'open') {
      console.log('Bot berhasil terhubung ke WhatsApp')
    }

    if (connection === 'close') {
      const statusCode =
        lastDisconnect?.error?.output?.statusCode

      const shouldReconnect =
        statusCode !== DisconnectReason.loggedOut

      console.log('Koneksi tertutup:', statusCode)

      if (shouldReconnect) {
        console.log('Mencoba terhubung kembali...')
        startBot()
      } else {
        console.log(
          'Sesi logout. Hapus folder auth_info lalu jalankan ulang.'
        )
      }
    }
  })

  // Wajib menyimpan credential yang berubah
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

      console.log(`${jid}: ${text}`)

      if (text.toLowerCase() === 'ping') {
        await sock.sendMessage(jid, {
          text: 'pong'
        })
      }

      if (text.toLowerCase() === 'menu') {
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

startBot()

