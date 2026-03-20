import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { db } from "./src/lib/db";
import { sql } from "drizzle-orm";

async function check() {
    try {
        const info = await db.run(sql`PRAGMA table_info(users)`);
        console.log("Users schema:", JSON.stringify(info, null, 2));
    } catch (e) {
        console.error(e);
    }
}
check();