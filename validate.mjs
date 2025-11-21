export function validateString(value) {
    return value !== undefined && value !== null && typeof value === "string";
}
//Skapar en funktion som kollar att ett värde är en string som vi exporterar
//Kollar att värdet inte är undefined eller null samt att det är en "string"





export function validateNumber(value) {
    return (
        value !== undefined && value !== null && typeof value === "number" && !Number.isNaN(value)
    );
}

//Skapar en funktion som kollar att värdet inte är undefined eller null, är ett "number" och att det inte kan vara NaN