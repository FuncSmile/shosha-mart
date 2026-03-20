import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { db } from "./src/lib/db";
import { sql } from "drizzle-orm";

async function check() {
    try {
        const count = await db.run(sql`SELECT count(*) FROM users`);
        console.log("Users count:", count);
    } catch (e) {
        console.error(e);
    }
}
check();