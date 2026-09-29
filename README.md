# Backend-API – produkter och leverantörer

Ett REST-API byggt med Node.js, Express och PostgreSQL för att hantera produkter och deras leverantörer. Databasen körs i Docker.

Individuellt projekt i backendkursen på EC Utbildningen (Frontendutvecklare, FEU25), hösten 2025.

## Funktioner

- **CRUD** (skapa, läsa, uppdatera och ta bort) för både produkter och leverantörer
- **Relation mellan tabeller:** varje produkt kopplas till en leverantör via en foreign key. Om en leverantör tas bort ligger produkten kvar, men utan leverantör (`ON DELETE SET NULL`)
- **JOIN-frågor:** produktlistan hämtar leverantörens uppgifter i samma anrop
- **Validering** av all indata, med tydliga felmeddelanden och rätt statuskoder (400, 404, 500)
- **Parametriserade SQL-frågor** (`$1`, `$2` …) som skyddar mot SQL-injektion
- **Uppdelade routes:** produkter och leverantörer ligger i egna filer
- Tabellerna skapas automatiskt när servern startar

## Tekniker

| Del      | Teknik                         |
| -------- | ------------------------------ |
| Server   | Node.js, Express 5             |
| Databas  | PostgreSQL (i Docker), `pg`    |
| Övrigt   | dotenv för miljövariabler      |

## Datamodell

**suppliers:** id, name, contact_person, email, phone_number, country

**products:** id, name, quantity, price, category, supplier_id → suppliers.id

## API

### Produkter

| Metod  | Endpoint         | Beskrivning                                   |
| ------ | ---------------- | --------------------------------------------- |
| GET    | `/products`      | Alla produkter, med leverantörens uppgifter   |
| GET    | `/products/:id`  | En produkt                                    |
| POST   | `/products`      | Skapa en produkt                              |
| PUT    | `/products/:id`  | Uppdatera en produkt                          |
| DELETE | `/products/:id`  | Ta bort en produkt                            |

### Leverantörer

| Metod  | Endpoint                   | Beskrivning                                  |
| ------ | -------------------------- | -------------------------------------------- |
| GET    | `/suppliers`               | Alla leverantörer                            |
| GET    | `/suppliers/:id`           | En leverantör, med antal produkter           |
| GET    | `/suppliers/:id/products`  | Alla produkter från en leverantör            |
| POST   | `/suppliers`               | Skapa en leverantör                          |
| PUT    | `/suppliers/:id`           | Uppdatera en leverantör                      |
| DELETE | `/suppliers/:id`           | Ta bort en leverantör                        |

## Kom igång

Kräver Node.js och Docker Desktop.

1. Starta en PostgreSQL-databas i Docker (första gången):

   ```bash
   docker run --name postgres-container -e POSTGRES_PASSWORD=ditt_lösenord -p 5432:5432 -d postgres
   ```

   Nästa gång räcker `docker start postgres-container`.

2. Skapa en `.env`-fil i projektets rot utifrån `.env.example`:

   ```
   DATABASE_HOST=localhost
   DATABASE_PORT=5432
   DATABASE_NAME=postgres
   DATABASE_USER=postgres
   DATABASE_PASSWORD=ditt_lösenord
   ```

3. Installera och starta servern:

   ```bash
   npm install
   node main.mjs
   ```

Servern körs på http://localhost:3000. Stäng av med `Ctrl + C` och stoppa databasen med `docker stop postgres-container`.
