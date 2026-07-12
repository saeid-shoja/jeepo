/**
 * Safe repair for local/dev migration history drift (no data loss).
 * - Removes orphan test migration record
 * - Removes failed/rolled-back duplicate records
 */
import pg from 'pg';

const connectionString =
  process.env.DATABASE_URL ?? 'postgresql://offroad:offroad@localhost:5432/offroad_shop';

const client = new pg.Client({ connectionString });

const CLEANUP_SQL = `
DELETE FROM "_prisma_migrations"
WHERE "migration_name" = '20260625172712_test_check';

DELETE FROM "_prisma_migrations"
WHERE "rolled_back_at" IS NOT NULL;
`;

async function main() {
  await client.connect();
  console.log('Repairing _prisma_migrations…');
  const result = await client.query(CLEANUP_SQL);
  console.log(`Removed ${result.rowCount ?? 0} bad migration row(s).`);

  const remaining = await client.query(
    `SELECT migration_name, finished_at IS NOT NULL AS applied
     FROM "_prisma_migrations"
     ORDER BY finished_at NULLS LAST, migration_name`,
  );
  console.log('Remaining migrations:', remaining.rows.length);
  for (const row of remaining.rows) {
    console.log(`  ${row.applied ? '✓' : '?'} ${row.migration_name}`);
  }

  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
