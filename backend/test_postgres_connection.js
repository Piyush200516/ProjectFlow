const { Client } = require('pg');

const passwords = ['postgres', 'admin', 'root', '123456', ''];

async function testConnection() {
  for (const password of passwords) {
    console.log(`Testing password: "${password}"...`);
    const client = new Client({
      host: 'localhost',
      port: 5432,
      user: 'postgres',
      password: password,
      database: 'postgres' // Connect to default database first
    });

    try {
      await client.connect();
      console.log(`\n🎉 SUCCESS! Working password found: "${password}"`);
      await client.end();
      process.exit(0);
    } catch (err) {
      console.log(`Failed for "${password}": ${err.message}`);
    }
  }
  console.log('\n❌ None of the common passwords worked.');
  process.exit(1);
}

testConnection();
