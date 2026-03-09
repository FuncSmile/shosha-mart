import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { relations, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";

export const tiers = sqliteTable("tiers", {
  id: text("id").primaryKey().$defaultFn(() => randomUUID()),
  name: text("name").notNull().unique(), // 'L24J' or 'SHOSHA'
});

export const tiersRelations = relations(tiers, ({ many }) => ({
  users: many(users),
  prices: many(tierPrices),
  orders: many(orders),
}));

export const users = sqliteTable("users", {
  id: text("id").primaryKey().$defaultFn(() => randomUUID()),
  username: text("username").notNull().unique(),
  phone: text("phone").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull(), // 'SUPERADMIN', 'ADMIN_TIER', 'BUYER'
  tierId: text("tier_id").references(() => tiers.id), // Null for SuperAdmin
  branchName: text("branch_name"), // Only for BUYER
  createdBy: text("created_by"), // ID of Admin who created this BUYER
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
}, (users) => ({
  createdByIndex: index("created_by_idx").on(users.createdBy),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  tier: one(tiers, {
    fields: [users.tierId],
    references: [tiers.id],
  }),
  orders: many(orders),
}));

export const products = sqliteTable("products", {
  id: text("id").primaryKey().$defaultFn(() => randomUUID()),
  name: text("name").notNull(),
  sku: text("sku").notNull().unique(),
  basePrice: integer("base_price").notNull(), // Only SuperAdmin
  stock: integer("stock").notNull().default(0), // Product stock
  unit: text("unit").notNull().default("Pcs"),
  imageUrl: text("image_url"), // Optional image URL for hybrid image management
  deletedAt: integer("deleted_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
}, (products) => ({
  deletedAtIndex: index("deleted_at_idx").on(products.deletedAt),
}));

export const productsRelations = relations(products, ({ many }) => ({
  tierPrices: many(tierPrices),
}));

export const tierPrices = sqliteTable("tier_prices", {
  id: text("id").primaryKey().$defaultFn(() => randomUUID()),
  productId: text("product_id").notNull().references(() => products.id),
  tierId: text("tier_id").notNull().references(() => tiers.id),
  price: integer("price"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
});

export const tierPricesRelations = relations(tierPrices, ({ one }) => ({
  product: one(products, {
    fields: [tierPrices.productId],
    references: [products.id],
  }),
  tier: one(tiers, {
    fields: [tierPrices.tierId],
    references: [tiers.id],
  }),
}));

export const orders = sqliteTable("orders", {
  id: text("id").primaryKey().$defaultFn(() => randomUUID()),
  buyerId: text("buyer_id").notNull().references(() => users.id),
  tierId: text("tier_id").notNull().references(() => tiers.id),
  totalAmount: integer("total_amount").notNull(),
  status: text("status").notNull(), // 'PENDING_APPROVAL', 'APPROVED', 'PACKING', 'REJECTED', 'PROCESSED'
  rejectionReason: text("rejection_reason"),
  adminNotes: text("admin_notes"), // Optional notes for audit logs (e.g. "Approved by SuperAdmin")
  createdAt: integer("created_at").notNull().$defaultFn(() => Date.now()),
}, (orders) => ({
  statusIdx: index("status_idx").on(orders.status),
  buyerIdx: index("buyer_idx").on(orders.buyerId),
  createdAtIdx: index("created_at_idx").on(orders.createdAt),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  buyer: one(users, {
    fields: [orders.buyerId],
    references: [users.id],
  }),
  tier: one(tiers, {
    fields: [orders.tierId],
    references: [tiers.id],
  }),
  items: many(orderItems),
}));

export const orderItems = sqliteTable("order_items", {
  id: text("id").primaryKey().$defaultFn(() => randomUUID()),
  orderId: text("order_id").notNull().references(() => orders.id),
  productId: text("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull(),
  priceAtPurchase: integer("price_at_purchase").notNull(),
});

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));
