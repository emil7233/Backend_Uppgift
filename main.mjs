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


app.put("/products/:id", async (req, res) => {
    const productId = Number.parseInt(req.params.id); //Konverterar till nummer

    if (!validateNumber(productId)) {
        res.status(400).json({ error: "Produktid måste vara ett nummer" }); //Validerar att det faktisikt är ett nummer
        return;
    }

    const name = req.body.name;
    const quantity = Number(req.body.quantity);
    const price = Number(req.body.price);
    const category = req.body.category;

    //Validerar all input

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

    //Kolla om produkten finns
    try {
        const existingProduct = await pool.query(
            "SELECT * FROM products WHERE id = $1",
            [productId]
        );

        if (!existingProduct.rows[0]) {
            res.status(404).json({ error: "Produkten finns inte" }); //Om produkten inte finns skickar vi ett felmeddelande
            return;
        }


        //Om all är som det ska uppdaterar vi produkten
        const update = await pool.query(
            `UPDATE products
            SET name = $1, quantity = $2, price = $3, category = $4
            WHERE id = $5
            RETURNING *`,
            [name, quantity, price, category, productId] //Matchar placeholders med arrayen som skickas in
        );

        res.json(update.rows[0]); //Skickar tillbaka den uppdaterade produkten som JSON


    } catch (error) { //Om något fel händer loggar vi det
        console.log(error);
        res.status(500).json({ error: "Ett oväntat fel inträffade" });
    }
});


app.delete("/products/:id", async (req, res) => {
    const productId = Number.parseInt(req.params.id); //Konverterar till nummer

    if (!validateNumber(productId)) {
        res.status(400).json({ error: "Produktid måste vara ett nummer" }); //Validerar att det faktiskt är ett nummer
        return;
    }

    try { //Försöker ta bort produkten från databasen
        const deleted = await pool.query(
            `DELETE FROM products
            WHERE id = $1
            RETURNING *`,
            [productId]
        );

        if (!deleted.rows[0]) { //Kollar om produkten finns
            res.status(404).json({ error: "Produkten finns inte" });
            return;
        }

        res.status(204).send(); //Skickar tillbaka status 204 (no content, allt gick som det skulle)

    } catch (error) { //Om något oväntat fel händer loggar vi det
        console.log(error);
        res.status(500).json({ error: "Ett oväntat fel inträffade" });
    }

});



app.get("/suppliers", async (req, res) => {
    const allSuppliers = await pool.query("SELECT * FROM suppliers");
    res.json(allSuppliers.rows);
});


app.get("/suppliers/:id", async (req, res) => {

});


app.post("/suppliers", async (req, res) => {
    const { name, contact_person, email, country } = req.body;
    const phone_number = Number.parseInt(req.body.phone_number);

    if (!validateString(name)) {
        res.status(400).json({ error: "Namnet måste vara en text" });
        return;
    }

    if (!validateString(contact_person)) {
        res.status(400).json({ error: "Kontaktperson måste vara en text" });
        return;
    }

    if (!validateString(email)) {
        res.status(400).json({ error: "Email måste vara en text" });
        return;
    }

    if (!validateNumber(phone_number)) {
        res.status(400).json({ error: "Telefonnummret måste vara ett nummer" });
        return;
    }

    if (!validateString(country)) {
        res.status(400).json({ error: "Landet måste vara en text" });
        return;
    }


    try {
        const result = await pool.query(`
            INSERT INTO suppliers (name, contact_person, email, phone_number, country)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *`,
            [name, contact_person, email, phone_number, country])


        res.status(201).json(result.rows[0]);

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Ett oväntat fel inträffade" });
    }
});


app.put("/suppliers/:id", async (req, res) => {
    const supplierId = Number.parseInt(req.params.id); //Konverterar supplierId från URL samt validerar

    if (!validateNumber(supplierId)) {
        res.status(400).json({ error: "Supplier id måste vara ett nummer" });
        return;
    }

    //Plockar ut alla värden från bodyn, förutom phone_number eftersom det behöver konverteras
    const { name, contact_person, email, country } = req.body;
    const phone_number = Number.parseInt(req.body.phone_number);
    //Validerar allt, samma som på products endpointen
    if (!validateString(name)) {
        res.status(400).json({ error: "Namnet måste vara en text" });
        return;
    }

    if (!validateString(contact_person)) {
        res.status(400).json({ error: "Kontaktperson måste vara en text" });
        return;
    }

    if (!validateString(email)) {
        res.status(400).json({ error: "Email måste vara en text" });
        return;
    }

    if (!validateNumber(phone_number)) {
        res.status(400).json({ error: "Telefonnummret måste vara ett nummer" });
        return;
    }

    if (!validateString(country)) {
        res.status(400).json({ error: "Landet måste vara en text" });
        return;
    }

    try { //Kollar om leverantören finns
        const existingSupplier = await pool.query(
            "SELECT * FROM suppliers WHERE id = $1",
            [supplierId]
        );

        if (!existingSupplier.rows[0]) {
            res.status(404).json({ error: "Leverantören finns inte" }); //Om leverantören inte finns skickar vi ett felmeddelande
            return;
        }

        const update = await pool.query( //Försöker uppdatera leverantören
            `UPDATE suppliers 
            SET name = $1, contact_person = $2, email = $3, phone_number = $4, country = $5
            WHERE id = $6
            RETURNING *`,
            [name, contact_person, email, phone_number, country, supplierId]
        );

        res.json(update.rows[0]);

    } catch (error) { //Catchar och loggar oväntade fel
        console.log(error);
        res.status(500).json({ error: "Ett oväntat fel inträffade" });
    }
});


app.delete("/suppliers/:id", async (req, res) => {

});


app.get("/suppliers/:id/products", async (req, res) => {

});




//Startar servern på port 3000
app.listen(3000, () => {
    console.log('Server igång på port 3000');
});