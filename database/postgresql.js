const { Client } = require('pg');

async function getDatabaseClient() {
    console.log("Connecting to database");
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    console.log("Client Host:Port" + client.host + ":" + client.port);
    await client.connect();
    return client;
}

async function closeClient(client) {
    client.end();
}

function rollback(client) {
    client.query('ROLLBACK', () => {
        client.end();
    });
}

module.exports = { getDatabaseClient, closeClient, rollback }
