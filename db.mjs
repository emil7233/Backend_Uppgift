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

    //Skapar suppliers tabellen innan products annars kommer foreign key inte fungera, eftersom Postgre inte kan referera till en tabell som inte finns än
    await pool.query(`
        CREATE TABLE IF NOT EXISTS suppliers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        contact_person VARCHAR(100),
        email VARCHAR(100),
        phone_number VARCHAR(20) NOT NULL,
        country VARCHAR(50) NOT NULL
        )`);

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
    category VARCHAR(50),
    suppliers_id INT REFERENCES supplier(id) ON DELETE SET NULL
    )`);

    //ON DELETE SET NULL = Om en supplier tas bort så blir supplier_id = NULL iställer för att produkten tas bort
    //supplier_id INT REFERENCES suppliers(id) = foreign key, denna kopplar varje product till en supplier


}

