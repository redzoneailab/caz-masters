import pg from "pg";
const client = new pg.Client({ connectionString: process.env.DIRECT_URL });
await client.connect();

const tables = await client.query(
  `SELECT tablename, rowsecurity FROM pg_tables
   WHERE schemaname='public' ORDER BY tablename`
);
const missing = tables.rows.filter((r) => !r.rowsecurity);
console.log(`Tables in public: ${tables.rows.length}`);
console.log(`RLS enabled:      ${tables.rows.length - missing.length}`);
console.log(`RLS missing:      ${missing.length}`);
if (missing.length) {
  console.log("Missing:", missing.map((r) => r.tablename).join(", "));
}

const pols = await client.query(
  `SELECT tablename, policyname, roles, cmd
   FROM pg_policies WHERE schemaname='public' ORDER BY tablename`
);
console.log(`\nPolicies: ${pols.rows.length}`);
console.table(pols.rows.slice(0, 3));

// Sanity check: can Prisma's role still read?
const probe = await client.query(`SELECT COUNT(*)::int AS n FROM "Tournament"`);
console.log(`\nProbe SELECT on Tournament (as ${(await client.query("SELECT current_user")).rows[0].current_user}): n=${probe.rows[0].n}`);

await client.end();
