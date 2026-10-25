import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export type ExifData = {
  camera?: string;
  lens?: string;
  iso?: number;
  aperture?: string;
  shutter?: string;
  focalLength?: string;
  capturedAt?: string;
};

export const adminUsers = pgTable("admin_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  totpSecret: text("totp_secret"),
  totpEnabled: boolean("totp_enabled").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const photos = pgTable(
  "photos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    description: text("description"),
    alt: text("alt").notNull(),
    width: integer("width").notNull(),
    height: integer("height").notNull(),
    widths: jsonb("widths").$type<number[]>().notNull().default([]),
    blurDataUrl: text("blur_data_url"),
    exif: jsonb("exif").$type<ExifData>(),
    priceCents: integer("price_cents").notNull().default(0),
    currency: text("currency").notNull().default("BRL"),
    license: text("license").notNull().default("personal"),
    status: text("status").notNull().default("draft"),
    featured: boolean("featured").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    originalKey: text("original_key").notNull(),
    originalName: text("original_name"),
    masterKey: text("master_key"),
    previewWidth: integer("preview_width").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("photos_status_idx").on(table.status),
    index("photos_featured_idx").on(table.featured),
    index("photos_created_idx").on(table.createdAt),
  ],
);

export const collections = pgTable("collections", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  published: boolean("published").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const collectionPhotos = pgTable(
  "collection_photos",
  {
    collectionId: uuid("collection_id")
      .notNull()
      .references(() => collections.id, { onDelete: "cascade" }),
    photoId: uuid("photo_id")
      .notNull()
      .references(() => photos.id, { onDelete: "cascade" }),
    position: integer("position").notNull().default(0),
  },
  (table) => [
    primaryKey({ columns: [table.collectionId, table.photoId] }),
    index("collection_photos_photo_idx").on(table.photoId),
  ],
);

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    provider: text("provider").notNull().default("mercadopago"),
    providerPreferenceId: text("provider_preference_id"),
    providerPaymentId: text("provider_payment_id").unique(),
    status: text("status").notNull().default("pending"),
    amountCents: integer("amount_cents").notNull(),
    currency: text("currency").notNull().default("BRL"),
    buyerEmail: text("buyer_email").notNull(),
    buyerName: text("buyer_name"),
    license: text("license").notNull().default("personal"),
    photoId: uuid("photo_id")
      .notNull()
      .references(() => photos.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    refundedAt: timestamp("refunded_at", { withTimezone: true }),
    deliveryStatus: text("delivery_status").notNull().default("pending"),
    deliveryError: text("delivery_error"),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
  },
  (table) => [
    index("orders_status_idx").on(table.status),
    index("orders_created_idx").on(table.createdAt),
  ],
);

export const downloads = pgTable(
  "downloads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    photoId: uuid("photo_id")
      .notNull()
      .references(() => photos.id, { onDelete: "restrict" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    maxDownloads: integer("max_downloads").notNull().default(5),
    downloadCount: integer("download_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("downloads_token_hash_idx").on(table.tokenHash),
    index("downloads_order_idx").on(table.orderId),
  ],
);

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    provider: text("provider").notNull().default("mercadopago"),
    providerPaymentId: text("provider_payment_id").unique(),
    method: text("method").notNull(),
    status: text("status").notNull().default("pending"),
    amountCents: integer("amount_cents").notNull(),
    idempotencyKey: text("idempotency_key").notNull().unique(),
    qrCode: text("qr_code"),
    qrCodeBase64: text("qr_code_base64"),
    ticketUrl: text("ticket_url"),
    barcode: text("barcode"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("payments_order_idx").on(table.orderId),
    index("payments_status_idx").on(table.status),
  ],
);

export const webhookEvents = pgTable("webhook_events", {
  id: text("id").primaryKey(),
  provider: text("provider").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type AdminUser = typeof adminUsers.$inferSelect;
export type Photo = typeof photos.$inferSelect;
export type Collection = typeof collections.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type Download = typeof downloads.$inferSelect;
export type Payment = typeof payments.$inferSelect;
