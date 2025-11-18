import { Pool } from "pg"; //Importerar PostgreSQL klienten så att Node kan "prata" med databasen
import dotenv from "dotenv";
dotenv.config();

export const pool = new Pool({
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT,
    database: process.env.DATABASE_NAME,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
});

export async function setupDatabase() {     // Exporterar funktionen som skapar databasen/tabeller
    await pool.connect();
    // Ansluter till databasen (await används eftersom funktionen är async)


    // Skapar products-tabellen om den inte redan finns (IF NOT EXISTS)
    // id SERIAL PRIMARY KEY = unik id som ökar automatiskt
    // name VARCHAR(100) NOT NULL = max 100 tecken, måste ha värde
    // quantity INT NOT NULL = heltal, måste ha värde
    // price NUMERIC(10,2) NOT NULL = decimal med totalt 10 siffror, varav 2 decimaler
    await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    quantity INT NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    category VARCHAR(50)
    )
    `);
}

