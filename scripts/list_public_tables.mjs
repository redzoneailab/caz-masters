import pg from "pg";
const client = new pg.Client({ connectionString: process.env.DIRECT_URL });
await client.connect();
const r = await client.query(
  `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='public' ORDER BY tablename`
);
console.table(r.rows);
await client.end();
