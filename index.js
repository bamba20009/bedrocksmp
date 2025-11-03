const WebSocket = require('ws');
const net = require('net');

// Konfiguracja
const LISTEN_PORT = process.env.PORT || 50046;  // Port z Heroku (lub lokalnie)
const TARGET_HOST = process.env.TARGET_HOST || 'bedrocksmp.pl';  // Host serwera Minecraft
const TARGET_PORT = Number(process.env.TARGET_PORT || 50046);  // Port serwera Minecraft

// Tworzymy serwer WebSocket
const wss = new WebSocket.Server({ port: LISTEN_PORT }, () => {
  console.log(`Proxy WebSocket na porcie ${LISTEN_PORT}, przekierowuje do ${TARGET_HOST}:${TARGET_PORT}`);
});

// Obsługuje połączenia WebSocket
wss.on('connection', (ws, req) => {
  console.log('Nowe połączenie WS z:', req.socket.remoteAddress);

  const socket = net.connect(TARGET_PORT, TARGET_HOST, () => {
    // Wysyłanie danych z TCP do WS
    socket.on('data', (chunk) => {
      if (ws.readyState === WebSocket.OPEN) ws.send(chunk);
    });
  });

  socket.on('close', () => { if (ws.readyState === WebSocket.OPEN) ws.close(); });
  socket.on('error', (err) => { console.error('Błąd TCP:', err.message); if (ws.readyState === WebSocket.OPEN) ws.close(); });

  // Wysyłanie danych z WS do TCP
  ws.on('message', (msg) => {
    if (!Buffer.isBuffer(msg)) msg = Buffer.from(msg);
    socket.write(msg);
  });

  ws.on('close', () => socket.end());
  ws.on('error', () => socket.end());
});

