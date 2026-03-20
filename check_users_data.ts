import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { db } from "./src/lib/db";
import { sql } from "drizzle-orm";

async function check() {
    try {
        const rows = await db.run(sql`SELECT id, username, has_completed_tour FROM users LIMIT 5`);
        console.log(JSON.stringify(rows, null, 2));
    } catch (e) {
        console.error(e);
    }
}
check();