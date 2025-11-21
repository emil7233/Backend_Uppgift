import express from "express";                      //Importerar express
import { pool, setupDatabase } from "./db.mjs";     //Importerar våran connectionpool och databas funktionen
import { validateNumber, validateString } from "./validate.mjs";  //Importerar validering funktionerna
const app = express();
app.use(express.json());                            //Middleware för att läsa in JSON data

setupDatabase();                                    //Kör funktionen som skapar product-tabellen


app.get("/products", async (req, res) => { //Hämta alla produkter
    const allProducts = await pool.query("SELECT * FROM products");
    res.json(allProducts.rows);
});

app.get("/products/:id", async (req, res) => {
    const productId = Number.parseInt(req.params.id);

    if (!validateNumber(productId)) {
        res.status(404).json({ error: "Produktnummret måste vara ett nummer" });
        return;
    }

    const result = await pool.query(
        "SELECT * FROM products WHERE id = $1",
        [productId]
    );

    if (!result.rows[0]) {
        res.status(404).json({ error: "Produkten finns inte" });
        return;
    }

    res.json(result.rows[0]);
});


//Startar servern på port 3000
app.listen(3000, () => {
    console.log('Server igång på port 3000');
});