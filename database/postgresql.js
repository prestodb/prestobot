const { Client } = require('pg');

async function getDatabaseClient() {
    console.log("Connecting to database");
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    console.log("Client Host:Port " + client.host + ":" + client.port);
    client.connect((err) => {
        if (err) {
            console.error('connection error', err.stack)
        } else {
            console.log('connected')
        }
    })
    console.log("Querying Hello World")
    const res = await client.query('SELECT $1::text as message', ['Hello world!'])
    console.log("Query Response: " + res.rows[0].message)
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
