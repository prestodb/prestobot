const { Client } = require('pg');

async function getDatabaseClient() {
    console.log("Connecting to database");
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });
    await client.connect()
        .then(() => console.log('Connected to database: 🎉'))
        .catch((err) => console.error('ERROR: database connection error', err.stack))

    console.log("Querying Hello World")
    const res = await client.query('SELECT $1::text as message', ['Hello world!'])
    console.log("✨ Query Response: " + res.rows[0].message)
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
