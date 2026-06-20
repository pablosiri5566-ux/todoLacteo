// Utility to convert numbers to Spanish words for invoices/budgets
// Handles numbers up to millions with decimal cents

const UNIDADES = ["", "un", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve"];
const DECENAS = ["", "diez", "veinte", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"];
const DIEZ_A_DIECINUEVE = [
  "diez", "once", "doce", "trece", "catorce", "quince", 
  "dieciséis", "diecisiete", "dieciocho", "diecinueve"
];
const VEINTES = [
  "veinte", "veintiuno", "veintidós", "veintitrés", "veinticuatro", 
  "veinticinco", "veintiséis", "veintitrés", "veintiocho", "veintinueve"
];
const CENTENAS = [
  "", "ciento", "doscientos", "trescientos", "cuatrocientos", 
  "quinientos", "seiscientos", "setecientos", "ochocientos", "novecientos"
];

function convertirGrupo(n: number): string {
  if (n === 0) return "";
  let palabras = "";

  const c = Math.floor(n / 100);
  const d = Math.floor((n % 100) / 10);
  const u = n % 10;

  if (c > 0) {
    if (c === 1 && d === 0 && u === 0) {
      palabras += "cien";
    } else {
      palabras += CENTENAS[c];
    }
  }

  if (d > 0) {
    if (palabras !== "") palabras += " ";
    if (d === 1) {
      palabras += DIEZ_A_DIECINUEVE[u];
      return palabras;
    } else if (d === 2) {
      palabras += VEINTES[u];
      return palabras;
    } else {
      palabras += DECENAS[d];
      if (u > 0) {
        palabras += " y " + UNIDADES[u];
      }
    }
  } else if (u > 0) {
    if (palabras !== "") palabras += " ";
    palabras += UNIDADES[u];
  }

  return palabras;
}

export function numberToWords(num: number, currency: "USD" | "ARS" | "EUR" = "USD"): string {
  if (num === 0) return "Cero";

  // Fix floating point errors
  const valor = Math.round(num * 100) / 100;
  const entero = Math.floor(valor);
  const centavos = Math.round((valor - entero) * 100);

  let palabras = "";

  if (entero === 0) {
    palabras = "cero";
  } else {
    const millones = Math.floor(entero / 1000000);
    const miles = Math.floor((entero % 1000000) / 1000);
    const unidades = entero % 1000;

    if (millones > 0) {
      if (millones === 1) {
        palabras += "un millón";
      } else {
        palabras += convertirGrupo(millones) + " millones";
      }
    }

    if (miles > 0) {
      if (palabras !== "") palabras += " ";
      if (miles === 1) {
        palabras += "mil";
      } else {
        palabras += convertirGrupo(miles) + " mil";
      }
    }

    if (unidades > 0) {
      if (palabras !== "") palabras += " ";
      palabras += convertirGrupo(unidades);
    }
  }

  // Adjust specific Spanish grammar rules
  palabras = palabras.replace(/\bun mil\b/g, "mil");
  palabras = palabras.trim();

  // Add Currency text
  let txtCurrency = "";
  if (currency === "USD") {
    txtCurrency = entero === 1 ? "dólar" : "dólares";
  } else if (currency === "ARS") {
    txtCurrency = entero === 1 ? "peso" : "pesos";
  } else if (currency === "EUR") {
    txtCurrency = entero === 1 ? "euro" : "euros";
  }

  // Format the centavos
  const txtCentavos = centavos > 0 
    ? ` con ${String(centavos).padStart(2, "0")}/100` 
    : "";

  // Capitalize first letter and format
  const result = `Son ${txtCurrency} ${palabras}${txtCentavos}`;
  return result.charAt(0).toUpperCase() + result.slice(1);
}
