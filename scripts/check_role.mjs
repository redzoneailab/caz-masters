import pg from "pg";
const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
const client = new pg.Client({ connectionString: url });
await client.connect();
const r = await client.query(
  `SELECT current_user::text AS current_user,
          current_setting('is_superuser') AS is_superuser,
          (SELECT rolbypassrls FROM pg_roles WHERE rolname = current_user) AS bypassrls`
);
console.log(JSON.stringify(r.rows, null, 2));
await client.end();
