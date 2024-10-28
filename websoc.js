const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

// Store game state per room
let rooms = {};

function broadcast(state) {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(state));
        }
    });
}
wss.on('connection', (ws) => {
    console.log('A new client connected');

    ws.on('message', (message) => {
        console.log(`Received message: ${message}`);

        // Parse the incoming message
        try {
            const parsedMessage = JSON.parse(message);
            const { action, roomID, gameState } = parsedMessage;
            if (parsedMessage.action === 'reset') {
                broadcast(gameState);
            }
            if (parsedMessage.action === 'exit') {
                ws.close(); // Close the connection for the exiting player
                broadcast({ message: 'A player has left the game.' }); // Inform other players
            }
            if (action === 'join') {
                // If the room doesn't exist, create it with an empty state
                if (!rooms[roomID]) {
                    rooms[roomID] = ['click', 'click', 'click', 'click', 'click', 'click', 'click', 'click', 'click'];
                }
                // Send the current room state to the newly connected client
                ws.send(JSON.stringify({ action: 'update', gameState: rooms[roomID] }));
            }

            if (action === 'move') {
                // Update the room's game state
                rooms[roomID] = gameState;

                // Broadcast the updated game state to all clients in the same room
                wss.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({ action: 'update', gameState: rooms[roomID] }));
                    }
                });
            }
        } catch (error) {
            console.log('Error parsing message:', error);
        }
    });

    ws.on('close', () => {
        console.log('A client disconnected');
    });
});
