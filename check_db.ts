
import { db } from "./src/lib/db";
import { tierPrices } from "./src/lib/db/schema";
import { sql } from "drizzle-orm";

async function check() {
    try {
        const result = await db.run(sql`PRAGMA table_info(tier_prices)`);
        console.log(JSON.stringify(result, null, 2));
    } catch (e) {
        console.error(e);
    }
}
check();
