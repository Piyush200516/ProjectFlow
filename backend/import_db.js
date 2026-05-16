const fs = require('fs');
const mysql = require('mysql2/promise');
const path = require('path');

async function importDatabase() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'root',
            multipleStatements: true
        });

        console.log('Connected to MySQL server.');

        const schemaPath = path.join(__dirname, '../database/projectflow_edu_schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        console.log('Importing schema...');
        await connection.query('DROP DATABASE IF EXISTS projectflow_edu;');
        await connection.query('CREATE DATABASE projectflow_edu;');
        await connection.query('USE projectflow_edu;');
        await connection.query(schema);
        
        console.log('Schema imported successfully.');
        await connection.end();
        process.exit(0);
    } catch (error) {
        console.error('Error importing schema:', error.message);
        process.exit(1);
    }
}

importDatabase();
