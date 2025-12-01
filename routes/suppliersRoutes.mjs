import express from "express";
import { pool } from "../db.mjs";
import { validateNumber, validateString } from "../validate.mjs";

const router = express.Router(); //Använder mig av router (blir som en "mini-app") så jag kan skapa endpoints i denna fil

//<--------- HÄMTA ALLA LEVERANTÖRER ---------> 
router.get("/", async (req, res) => {
    try {
        const allSuppliers = await pool.query("SELECT * FROM suppliers");
        res.json(allSuppliers.rows);

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Ett oväntat fel inträffade" });
    }
});


//<--------- HÄMTA ALLA PRODUTKER FRÅN EN SPECIFIK LEVERNATÖR ---------> 
router.get("/:id/products", async (req, res) => {
    const supplierId = Number.parseInt(req.params.id);  //Konverterar supplier id

    if (!validateNumber(supplierId)) {
        res.status(400).json({ error: "Leverantör ID måste vara ett nummer" });
        return;
    }

    try { //Kolla om leverantören finns
        const supplier = await pool.query(
            `SELECT * FROM suppliers
            WHERE id = $1`,
            [supplierId]
        );

        if (!supplier.rows[0]) {
            res.status(404).json({ error: "Leverantören finns inte" }); //404 not found
            return;
        }
        //Hämta alla produkter från leverantören man anger
        const products = await pool.query(
            `SELECT * FROM products
            WHERE supplier_id = $1`,
            [supplierId]
        );

        res.json(products.rows);

    } catch (error) { //Fångar oväntade fel
        console.log(error);
        res.status(500).json({ error: "Ett oväntat fel inträffade" });
    }
});


//<--------- HÄMTA EN LEVERANTÖR MED ANTAL PRODUKTER ---------> 
router.get("/:id", async (req, res) => {
    const supplierId = Number.parseInt(req.params.id); //Konverterar samt validerar 

    if (!validateNumber(supplierId)) {
        res.status(400).json({ error: "Leverantör ID måste vara ett nummer" });
        return;
    }

    try {
        const result = await pool.query(
            `SELECT * FROM suppliers 
            WHERE id = $1`,
            [supplierId]
        );

        if (!result.rows[0]) { //Kollar om leverantören finns
            res.status(404).json({ error: "Leverantören finns inte" });
            return;
        }

        const count = await pool.query( //Räknar antalet produkter som hör till leverantören med id:t man anger, ger kolumnen namnet product_count med hjälp av AS
            `SELECT COUNT(products.id) AS product_count
            FROM suppliers
            LEFT JOIN products
            ON suppliers.id = products.supplier_id
            WHERE suppliers.id = $1`,
            [supplierId] //Kopplar levernatörer med produkter tack vare foreign key supplier_id, LEFT JOIN för att även få med leverantörer utan produkter
        );
        res.json({ //Istället för att skriva ut alla fält manuellt (id, name osv) använder jag "..." för att "sprida ut" alla egenskaper vi efterfrågade i queryn i ett nytt objekt
            ...result.rows[0],
            product_count: count.rows[0].product_count //Lägger till product_count för att visa hur många produkter leverantören har
        });

    } catch (error) { //Fångar oväntade fel
        console.log(error);
        res.status(500).json({ error: "Ett oväntat fel inträffade" });
    }
});


//<--------- LÄGG TILL EN LEVERANTÖR ---------> 
router.post("/", async (req, res) => {
    const { name, contact_person, email, country } = req.body;
    const phone_number = Number.parseInt(req.body.phone_number);


    //Validerar 
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


    try { //Försöker skapa ny supplier
        const result = await pool.query(`
            INSERT INTO suppliers (name, contact_person, email, phone_number, country)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *`,
            [name, contact_person, email, phone_number, country])


        res.status(201).json(result.rows[0]);

    } catch (error) { //Catchar och loggar oväntade fel
        console.log(error);
        res.status(500).json({ error: "Ett oväntat fel inträffade" });
    }
});


//<--------- UPPDATERA EN LEVERANTÖR ---------> 
router.put("/:id", async (req, res) => {
    const supplierId = Number.parseInt(req.params.id); //Konverterar supplierId från URL samt validerar

    if (!validateNumber(supplierId)) {
        res.status(400).json({ error: "Supplier id måste vara ett nummer" });
        return;
    }

    //Plockar ut alla värden från bodyn, förutom phone_number eftersom det behöver konverteras, vilket jag gör separat
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

        res.json(update.rows[0]); //Svarar med den uppdaterade raden

    } catch (error) { //Catchar och loggar oväntade fel
        console.log(error);
        res.status(500).json({ error: "Ett oväntat fel inträffade" });
    }
});


//<--------- RADERA EN LEVERANTÖR --------->
router.delete("/:id", async (req, res) => {
    const supplierId = Number.parseInt(req.params.id); //Konverterar
    if (!validateNumber(supplierId)) {
        res.status(400).json({ error: "Leverantör ID måste vara ett nummer" });
        return;
    }

    try {
        const deleted = await pool.query( //Försöker radera suppliern
            `DELETE FROM suppliers
            WHERE id = $1
            RETURNING *`,
            [supplierId]
        );

        if (!deleted.rows[0]) { //Kollar om supplier finns
            res.status(404).json({ error: "Leverantören finns inte" });
            return;
        }

        res.status(204).send(); //Skickar tillbaka status 204 (no content, allt gick som det skulle)

    } catch (error) { //Om något oväntat fel händer loggar vi det
        console.log(error);
        res.status(500).json({ error: "Ett oväntat fel inträffade" });
    }
});

export default router; //Exporterar min router så vi kan använda den i main.mjs