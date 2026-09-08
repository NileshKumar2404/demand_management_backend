class SSEService {
    constructor() {
        this.clients = new Set()
        this.heartbeatInterval = null
        this.initHeartbeat()
    }

    initHeartbeat() {
        // Send heartbeat comment every 25 seconds to keep connections alive
        this.heartbeatInterval = setInterval(() => {
            for (const client of this.clients) {
                try {
                    client.res.write(': heartbeat\n\n')
                } catch {
                    this.removeClient(client)
                }
            }
        }, 25000)
    }

    addClient(req, res) {
        // Set standard SSE headers
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept'
        })

        const client = { id: Date.now() + Math.random(), res }
        this.clients.add(client)

        // Send initial connected event
        res.write(`event: connected\ndata: ${JSON.stringify({ connected: true, clientCount: this.clients.size })}\n\n`)

        req.on('close', () => {
            this.removeClient(client)
        })

        return client
    }

    removeClient(client) {
        this.clients.delete(client)
        try {
            client.res.end()
        } catch {
            // ignore
        }
    }

    broadcastNotification(notification) {
        const payload = JSON.stringify(notification)
        for (const client of this.clients) {
            try {
                client.res.write(`event: notification\ndata: ${payload}\n\n`)
            } catch {
                this.removeClient(client)
            }
        }
    }
}

export const sseService = new SSEService()
