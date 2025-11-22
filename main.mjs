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
    const productId = Number.parseInt(req.params.id); //Hämta id och konverterar till nummer

    if (!validateNumber(productId)) {
        res.status(404).json({ error: "Produktnummret måste vara ett nummer" }); //Validerar att id är ett giltigt nummer
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


app.post("/products", async (req, res) => {
    const name = req.body.name;
    const quantity = Number.parseInt(req.body.quantity); //Behöver konvertera quantity och price från string till nummer
    const price = Number.parseInt(req.body.price);       //JSON skickar alltid nummer som string i Express
    const category = req.body.category;

    //Börjar med att validera all input i bodyn med våra tidigare skrivna valideringsfunktioner
    if (!validateString(name)) {
        res.status(400).json({ error: "Namn måste vara text" });
        return;
    }

    if (!validateNumber(quantity)) {
        res.status(400).json({ error: "Antalet måste vara ett nummer" });
        return;
    }

    if (!validateNumber(price)) {
        res.status(400).json({ error: "Pris måste vara ett nummer" });
        return;
    }

    if (!validateString(category)) {
        res.status(400).json({ error: "Kategorin måste vara en text" });
        return;
    }

    try { //Om valideringen går igenom försöker vi lägga till produkten
        const result = await pool.query(
            `INSERT INTO products (name, quantity, price, category)
            VALUES ($1, $2, $3, $4)
            RETURNING *`,
            [name, quantity, price, category], //Array som vi skickar till databasen. Byter ut placeholders från SQL koden ($1, $2 osv.)
        );

        res.status(201).json(result.rows[0]) //Svarar med den nya produkten samt status 201

    } catch (error) { //Om något går fel skriver vi ut felet samt svarar med status 500
        console.log(error);
        res.status(500).json({ error: "Ett oväntat fel inträffade" });
    }
});


//Startar servern på port 3000
app.listen(3000, () => {
    console.log('Server igång på port 3000');
});