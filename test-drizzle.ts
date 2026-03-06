import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { drizzle } from "drizzle-orm/libsql";
import { eq, sql } from "drizzle-orm";

const orders = sqliteTable("orders", {
  id: text("id").primaryKey(),
  status: text("status"),
});

const baseWhereClause = eq(orders.status, "PROCESSED");

const db = drizzle({} as any);

const validOrdersQuery = db
  .select({ id: orders.id })
  .from(orders)
  .where(baseWhereClause)
  .as('validOrders');

console.log("validOrdersQuery.id:", validOrdersQuery.id);

try {
  const query = db.select({ id: orders.id }).from(orders).innerJoin(validOrdersQuery, eq(orders.id, sql`${validOrdersQuery.id}`)).toSQL();
  console.log("query:", query);
} catch (e) {
  console.error(e);
}
