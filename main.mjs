import express from "express";                      //Importerar express
import { pool, setupDatabase } from "./db.mjs";     //Importerar våran connectionpool och databas funktionen
const app = express();
app.use(express.json());                            //Middleware för att läsa in JSON data

setupDatabase();                                    //Kör funktionen som skapar product-tabellen




//Startar servern på port 3000
app.listen(3000, () => {
    console.log('Server igång på port 3000');
});