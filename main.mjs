import express from "express";                      //Importerar express
import { setupDatabase } from "./db.mjs";     //Importerar våran databas funktion
import productsRoutes from "./routes/productsRoutes.mjs"; //Importerar våra endpoints
import suppliersRoutes from "./routes/suppliersRoutes.mjs";


const app = express();
app.use(express.json());                            //Middleware för att läsa in JSON data
setupDatabase();                                    //Kör funktionen som skapar products och suppliers-tabellen


app.use("/products", productsRoutes); //Alla requests som använder /products ska hanteras av productsRoutes filen
app.use("/suppliers", suppliersRoutes);

//Startar servern på port 3000
app.listen(3000, () => {
    console.log('Server igång på port 3000');
});