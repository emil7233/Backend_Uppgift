import express from "express";                      //Importerar express
import { pool, setupDatabase } from "./db.mjs";     //Importerar våran connectionpool och databas funktionen
import { validateNumber, validateString } from "./validate.mjs";  //Importerar validering funktionerna
const app = express();
app.use(express.json());                            //Middleware för att läsa in JSON data

setupDatabase();                                    //Kör funktionen som skapar products och suppliers-tabellen

//<--------- HÄMTA ALLA PRODUKTER ---------> 
app.get("/products", async (req, res) => { //Hämta alla produkter
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
app.get("/products/:id", async (req, res) => {
    const productId = Number.parseInt(req.params.id); //Hämta id och konverterar till nummer
    try {
        if (!validateNumber(productId)) {
            res.status(404).json({ error: "Produktnummret måste vara ett nummer" }); //Validerar att id är ett giltigt nummer
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
app.post("/products", async (req, res) => {
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
app.put("/products/:id", async (req, res) => {
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


//<--------- HÄMTA ALLA LEVERANTÖRER ---------> 
app.get("/suppliers", async (req, res) => {
    const allSuppliers = await pool.query("SELECT * FROM suppliers");
    res.json(allSuppliers.rows);
});

//<--------- HÄMTA EN LEVERANTÖR MED ANTAL PRODUKTER ---------> 
app.get("/suppliers/:id", async (req, res) => {
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
app.post("/suppliers", async (req, res) => {
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
app.put("/suppliers/:id", async (req, res) => {
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
app.delete("/suppliers/:id", async (req, res) => {
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

//<--------- HÄMTA ALLA PRODUTKER FRÅN EN SPECIFIK LEVERNATÖR ---------> 
app.get("/suppliers/:id/products", async (req, res) => {
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




//Startar servern på port 3000
app.listen(3000, () => {
    console.log('Server igång på port 3000');
});