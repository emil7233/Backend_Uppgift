import express from "express";
import { pool } from "../db.mjs";
import { validateNumber, validateString } from "../validate.mjs";

const router = express.Router(); //Använder mig av router (blir som en "mini-app") så jag kan skapa endpoints i denna fil

//<--------- HÄMTA ALLA PRODUKTER ---------> 
router.get("/", async (req, res) => { //Hämta alla produkter
    try {
        const allProducts = await pool.query(
            //Här listar jag alla kolumner manuellt istället för SELECT * för att undvika namnkonflikter
            //Både products och suppliers har name och id som kolumner

            `SELECT products.id, 
            products.name,
            products.quantity,
            products.price,
            products.category,
            suppliers.id AS supplier_id,
            suppliers.name AS supplier_name,
            suppliers.contact_person,
            suppliers.email,
            suppliers.phone_number,
            suppliers.country
            FROM products LEFT JOIN suppliers ON products.supplier_id = suppliers.id
            `);

        //Använder AS suppliers_id och suppliers_name eftersom de behöver ett unikt namn annars skrivs det över, eftersom products har samma namn på kolumnerna
        //När jag gör JOIN så har vi ju 2 name och id, därav måste en av tabellerna ha ett unikt namn på kolumnenerna

        res.json(allProducts.rows); //Skriver ut alla produkter

    } catch (error) { //Fångar oväntade fel
        console.log(error);
        res.status(500).json({ error: "Ett oväntat fel inträffade" });
    }
});


// <--------- HÄMTA SPECIFIK PRODUCT --------->
router.get("/:id", async (req, res) => {
    const productId = Number.parseInt(req.params.id); //Hämta id och konverterar till nummer
    try {
        if (!validateNumber(productId)) {
            res.status(400).json({ error: "Produktnummret måste vara ett nummer" }); //Validerar att id är ett giltigt nummer
            return;
        }
        //Hämta din specifika produkt
        const result = await pool.query(
            "SELECT * FROM products WHERE id = $1",
            [productId]
        );
        //Om produkten inte finns skriver vi ut det samt statuskod 404 not found
        if (!result.rows[0]) {
            res.status(404).json({ error: "Produkten finns inte" });
            return;
        }

        res.json(result.rows[0]); //Skriver ut första raden från resultatet som JSON

    } catch (error) { //Fångar oväntade fel
        console.log(error);
        res.status(500).json({ error: "Ett oväntat fel inträffade" }); //Svarar med kod 500(Internal server error)
    }
});


//<--------- LÄGG TILL EN PRODUKT --------->
router.post("/", async (req, res) => {
    const name = req.body.name;
    const quantity = Number.parseInt(req.body.quantity); //Säkerställer att quantity och price blir nummer, oavsett om klienten skickade string eller number
    const price = Number.parseFloat(req.body.price); //Float för att tillåta decimaler
    const category = req.body.category;
    const supplier_id = Number.parseInt(req.body.supplier_id);

    if (!validateNumber(supplier_id)) {
        res.status(400).json({ error: "Supplier id måste vara ett nummer" });
        return;
    }

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
            `INSERT INTO products (name, quantity, price, category, supplier_id)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *`,
            [name, quantity, price, category, supplier_id], //Array som vi skickar till databasen. Byter ut placeholders från SQL koden ($1, $2 osv.)
        );

        res.status(201).json(result.rows[0]) //Svarar med den nya produkten samt status 201 created

    } catch (error) { //Om något går fel skriver vi ut felet samt svarar med status 500
        console.log(error);
        res.status(500).json({ error: "Ett oväntat fel inträffade" });
    }
});


//<--------- UPPDATERA EN PRODUKT --------->
router.put("/:id", async (req, res) => {
    const productId = Number.parseInt(req.params.id); //Konverterar till nummer

    if (!validateNumber(productId)) {
        res.status(400).json({ error: "Produktid måste vara ett nummer" }); //Validerar att det faktisikt är ett nummer
        return;
    }

    const name = req.body.name;
    const quantity = Number(req.body.quantity);
    const price = Number.parseFloat(req.body.price);
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


//<--------- RADERA EN PRODUKT --------->
router.delete("/:id", async (req, res) => {
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

export default router; //Exporterar min router så vi kan använda den i main.mjs