// index.js
const WebSocket = require('ws');
const net = require('net');

// Konfiguracja
const LISTEN_PORT = process.env.PORT || 50046;  // GitHub ustawi automatycznie port (jeśli dostępny)
const TARGET_HOST = process.env.TARGET_HOST || 'bedrocksmp.pl';  // Host Minecraft
const TARGET_PORT = Number(process.env.TARGET_PORT || 50046);  // Port Minecraft (50046)

// WebSocket server
const wss = new WebSocket.Server({ port: LISTEN_PORT }, () => {
  console.log(`WS->TCP proxy nasłuchuje na porcie ${LISTEN_PORT} -> ${TARGET_HOST}:${TARGET_PORT}`);
});

// Obsługuje połączenia WebSocket
wss.on('connection', (ws, req) => {
  console.log('Nowe połączenie WS z:', req.socket.remoteAddress);

  const socket = net.connect(TARGET_PORT, TARGET_HOST, () => {
    // Wysłanie danych z TCP do WS
    socket.on('data', (chunk) => {
      if (ws.readyState === WebSocket.OPEN) ws.send(chunk);
    });
  });

  socket.on('close', () => { if (ws.readyState === WebSocket.OPEN) ws.close(); });
  socket.on('error', (err) => { console.error('TCP error:', err.message); if (ws.readyState === WebSocket.OPEN) ws.close(); });

  // Wysłanie danych z WS do TCP
  ws.on('message', (msg) => {
    if (!Buffer.isBuffer(msg)) msg = Buffer.from(msg);
    socket.write(msg);
  });

  ws.on('close', () => socket.end());
  ws.on('error', () => socket.end());
});
