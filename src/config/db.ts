import mysql from "mysql2/promise";

console.log("🔥 DB.TS LOADED");

export const pool = mysql.createPool({
  host: process.env.DB_HOST ?? "127.0.0.1",
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? "root",
  password: process.env.DB_PASSWORD ?? "",
  database: process.env.DB_NAME ?? "aqua_grace",

  ssl: {
    minVersion: "TLSv1.2",
  },

  waitForConnections: true,
  connectionLimit: 10,
});

pool.query("SELECT DATABASE() AS db, @@hostname AS host")
  .then(([rows]) => {
    console.log("CONNECTED DATABASE:", rows);
  })
  .catch((error) => {
    console.error("DATABASE CHECK ERROR:", error);
  });

pool.query("SHOW CREATE TABLE orders")
  .then(([rows]) => {
    console.log("ORDERS TABLE FROM RENDER:", rows);
  })
  .catch((error) => {
    console.error("ORDERS TABLE CHECK ERROR:", error);
  });
  