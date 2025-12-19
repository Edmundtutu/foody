BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS "combo_group_category_hints" (
	"id"	varchar NOT NULL,
	"combo_group_id"	varchar NOT NULL,
	"category_id"	varchar NOT NULL,
	"created_at"	datetime,
	"updated_at"	datetime,
	PRIMARY KEY("id"),
	FOREIGN KEY("category_id") REFERENCES "menu_categories"("id") on delete cascade,
	FOREIGN KEY("combo_group_id") REFERENCES "combo_groups"("id") on delete cascade
);
CREATE TABLE IF NOT EXISTS "combo_group_items" (
	"id"	varchar NOT NULL,
	"combo_group_id"	varchar NOT NULL,
	"dish_id"	varchar NOT NULL,
	"extra_price"	numeric NOT NULL DEFAULT '0',
	"created_at"	datetime,
	"updated_at"	datetime,
	PRIMARY KEY("id"),
	FOREIGN KEY("combo_group_id") REFERENCES "combo_groups"("id") on delete cascade,
	FOREIGN KEY("dish_id") REFERENCES "dishes"("id") on delete cascade
);
CREATE TABLE IF NOT EXISTS "combo_groups" (
	"id"	varchar NOT NULL,
	"combo_id"	varchar NOT NULL,
	"name"	varchar NOT NULL,
	"allowed_min"	integer NOT NULL DEFAULT '1',
	"allowed_max"	integer NOT NULL DEFAULT '1',
	"created_at"	datetime,
	"updated_at"	datetime,
	PRIMARY KEY("id"),
	FOREIGN KEY("combo_id") REFERENCES "combos"("id") on delete cascade
);
CREATE TABLE IF NOT EXISTS "combo_selection_items" (
	"id"	varchar NOT NULL,
	"combo_selection_id"	varchar NOT NULL,
	"dish_id"	varchar NOT NULL,
	"options"	text,
	"price"	numeric NOT NULL,
	"created_at"	datetime,
	"updated_at"	datetime,
	PRIMARY KEY("id"),
	FOREIGN KEY("combo_selection_id") REFERENCES "combo_selections"("id") on delete cascade,
	FOREIGN KEY("dish_id") REFERENCES "dishes"("id") on delete cascade
);
CREATE TABLE IF NOT EXISTS "combo_selections" (
	"id"	varchar NOT NULL,
	"combo_id"	varchar NOT NULL,
	"user_id"	varchar,
	"total_price"	numeric NOT NULL,
	"created_at"	datetime,
	"updated_at"	datetime,
	PRIMARY KEY("id"),
	FOREIGN KEY("combo_id") REFERENCES "combos"("id") on delete cascade,
	FOREIGN KEY("user_id") REFERENCES "users"("id") on delete set null
);
CREATE TABLE IF NOT EXISTS "combos" (
	"id"	varchar NOT NULL,
	"restaurant_id"	varchar NOT NULL,
	"name"	varchar NOT NULL,
	"description"	text,
	"tags"	text,
	"images"	text,
	"order_count"	integer NOT NULL DEFAULT '0',
	"pricing_mode"	varchar NOT NULL DEFAULT 'FIXED' CHECK("pricing_mode" IN ('FIXED', 'DYNAMIC', 'HYBRID')),
	"base_price"	numeric NOT NULL DEFAULT '0',
	"available"	tinyint(1) NOT NULL DEFAULT '1',
	"created_at"	datetime,
	"updated_at"	datetime,
	PRIMARY KEY("id"),
	FOREIGN KEY("restaurant_id") REFERENCES "restaurants"("id") on delete cascade
);
CREATE TABLE IF NOT EXISTS "conversations" (
	"id"	varchar NOT NULL,
	"order_id"	varchar NOT NULL,
	"customer_id"	varchar NOT NULL,
	"restaurant_id"	varchar NOT NULL,
	"status"	varchar NOT NULL DEFAULT 'active' CHECK("status" IN ('active', 'closed', 'archived')),
	"last_message_at"	datetime,
	"created_at"	datetime,
	"updated_at"	datetime,
	PRIMARY KEY("id"),
	FOREIGN KEY("customer_id") REFERENCES "users"("id"),
	FOREIGN KEY("order_id") REFERENCES "orders"("id"),
	FOREIGN KEY("restaurant_id") REFERENCES "restaurants"("id")
);
CREATE TABLE IF NOT EXISTS "dish_options" (
	"id"	varchar NOT NULL,
	"dish_id"	varchar NOT NULL,
	"name"	varchar NOT NULL,
	"extra_cost"	integer NOT NULL DEFAULT '0',
	"required"	tinyint(1) NOT NULL DEFAULT '0',
	"created_at"	datetime,
	"updated_at"	datetime,
	"deleted_at"	datetime,
	PRIMARY KEY("id"),
	FOREIGN KEY("dish_id") REFERENCES "dishes"("id")
);
CREATE TABLE IF NOT EXISTS "dishes" (
	"id"	varchar NOT NULL,
	"restaurant_id"	varchar NOT NULL,
	"category_id"	varchar NOT NULL,
	"name"	varchar NOT NULL,
	"description"	text,
	"price"	integer NOT NULL DEFAULT '0',
	"unit"	varchar NOT NULL DEFAULT 'plate',
	"available"	tinyint(1) NOT NULL DEFAULT '1',
	"images"	text,
	"tags"	text,
	"created_at"	datetime,
	"updated_at"	datetime,
	"deleted_at"	datetime,
	PRIMARY KEY("id"),
	FOREIGN KEY("category_id") REFERENCES "menu_categories"("id"),
	FOREIGN KEY("restaurant_id") REFERENCES "restaurants"("id")
);
CREATE TABLE IF NOT EXISTS "inventory_node_edges" (
	"id"	varchar NOT NULL,
	"restaurant_id"	varchar NOT NULL,
	"source_node_id"	varchar NOT NULL,
	"target_node_id"	varchar NOT NULL,
	"label"	varchar,
	"metadata"	text,
	"created_at"	datetime,
	"updated_at"	datetime,
	PRIMARY KEY("id"),
	FOREIGN KEY("restaurant_id") REFERENCES "restaurants"("id") on delete cascade,
	FOREIGN KEY("source_node_id") REFERENCES "inventory_nodes"("id") on delete cascade,
	FOREIGN KEY("target_node_id") REFERENCES "inventory_nodes"("id") on delete cascade
);
CREATE TABLE IF NOT EXISTS "inventory_nodes" (
	"id"	varchar NOT NULL,
	"restaurant_id"	varchar NOT NULL,
	"category_id"	varchar,
	"entity_type"	varchar NOT NULL CHECK("entity_type" IN ('dish', 'modification', 'category')),
	"entity_id"	varchar,
	"display_name"	varchar,
	"x"	integer NOT NULL DEFAULT '0',
	"y"	integer NOT NULL DEFAULT '0',
	"available"	tinyint(1) NOT NULL DEFAULT '1',
	"color_code"	varchar,
	"metadata"	text,
	"created_at"	datetime,
	"updated_at"	datetime,
	"deleted_at"	datetime,
	PRIMARY KEY("id"),
	FOREIGN KEY("category_id") REFERENCES "menu_categories"("id"),
	FOREIGN KEY("restaurant_id") REFERENCES "restaurants"("id") on delete cascade
);
CREATE TABLE IF NOT EXISTS "menu_categories" (
	"id"	varchar NOT NULL,
	"restaurant_id"	varchar NOT NULL,
	"name"	varchar NOT NULL,
	"description"	text,
	"display_order"	integer NOT NULL DEFAULT '0',
	"color_code"	varchar,
	"created_at"	datetime,
	"updated_at"	datetime,
	"deleted_at"	datetime,
	PRIMARY KEY("id"),
	FOREIGN KEY("restaurant_id") REFERENCES "restaurants"("id")
);
CREATE TABLE IF NOT EXISTS "messages" (
	"id"	varchar NOT NULL,
	"conversation_id"	varchar NOT NULL,
	"sender_id"	varchar NOT NULL,
	"sender_role"	varchar NOT NULL DEFAULT 'customer' CHECK("sender_role" IN ('customer', 'restaurant', 'system')),
	"content"	text,
	"read_at"	datetime,
	"created_at"	datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY("id"),
	FOREIGN KEY("conversation_id") REFERENCES "conversations"("id"),
	FOREIGN KEY("sender_id") REFERENCES "users"("id")
);
CREATE TABLE IF NOT EXISTS "migrations" (
	"id"	integer NOT NULL,
	"migration"	varchar NOT NULL,
	"batch"	integer NOT NULL,
	PRIMARY KEY("id" AUTOINCREMENT)
);
CREATE TABLE IF NOT EXISTS "order_items" (
	"id"	varchar NOT NULL,
	"order_id"	varchar NOT NULL,
	"orderable_type"	varchar NOT NULL,
	"orderable_id"	varchar NOT NULL,
	"quantity"	integer NOT NULL DEFAULT '1',
	"unit_price"	integer NOT NULL DEFAULT '0',
	"total_price"	integer NOT NULL DEFAULT '0',
	"notes"	text,
	"options"	text,
	"created_at"	datetime,
	"updated_at"	datetime,
	"deleted_at"	datetime,
	PRIMARY KEY("id"),
	FOREIGN KEY("order_id") REFERENCES "orders"("id")
);
CREATE TABLE IF NOT EXISTS "orders" (
	"id"	varchar NOT NULL,
	"user_id"	varchar NOT NULL,
	"restaurant_id"	varchar NOT NULL,
	"total"	integer NOT NULL DEFAULT '0',
	"status"	varchar NOT NULL DEFAULT 'pending' CHECK("status" IN ('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled')),
	"notes"	text,
	"created_at"	datetime,
	"updated_at"	datetime,
	"deleted_at"	datetime,
	PRIMARY KEY("id"),
	FOREIGN KEY("restaurant_id") REFERENCES "restaurants"("id"),
	FOREIGN KEY("user_id") REFERENCES "users"("id")
);
CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
	"email"	varchar NOT NULL,
	"token"	varchar NOT NULL,
	"created_at"	datetime,
	PRIMARY KEY("email")
);
CREATE TABLE IF NOT EXISTS "personal_access_tokens" (
	"id"	integer NOT NULL,
	"tokenable_type"	varchar NOT NULL,
	"tokenable_id"	varchar NOT NULL,
	"name"	text NOT NULL,
	"token"	varchar NOT NULL,
	"abilities"	text,
	"last_used_at"	datetime,
	"expires_at"	datetime,
	"created_at"	datetime,
	"updated_at"	datetime,
	PRIMARY KEY("id" AUTOINCREMENT)
);
CREATE TABLE IF NOT EXISTS "restaurants" (
	"id"	varchar NOT NULL,
	"owner_id"	varchar NOT NULL,
	"name"	varchar NOT NULL,
	"description"	text,
	"phone"	varchar,
	"email"	varchar,
	"address"	text,
	"latitude"	numeric,
	"longitude"	numeric,
	"verification_status"	varchar NOT NULL DEFAULT 'pending' CHECK("verification_status" IN ('pending', 'verified', 'rejected')),
	"config"	text,
	"created_at"	datetime,
	"updated_at"	datetime,
	"deleted_at"	datetime,
	PRIMARY KEY("id"),
	FOREIGN KEY("owner_id") REFERENCES "users"("id")
);
CREATE TABLE IF NOT EXISTS "reviews" (
	"id"	varchar NOT NULL,
	"user_id"	varchar NOT NULL,
	"reviewable_type"	varchar NOT NULL CHECK("reviewable_type" IN ('restaurant', 'dish')),
	"reviewable_id"	varchar NOT NULL,
	"rating"	integer NOT NULL,
	"comment"	text,
	"created_at"	datetime,
	"updated_at"	datetime,
	PRIMARY KEY("id"),
	FOREIGN KEY("user_id") REFERENCES "users"("id")
);
CREATE TABLE IF NOT EXISTS "users" (
	"id"	varchar NOT NULL,
	"name"	varchar NOT NULL,
	"email"	varchar,
	"phone"	varchar,
	"password"	varchar,
	"role"	varchar NOT NULL DEFAULT 'customer' CHECK("role" IN ('customer', 'restaurant', 'admin')),
	"profile"	text,
	"remember_token"	varchar,
	"created_at"	datetime,
	"updated_at"	datetime,
	"deleted_at"	datetime,
	PRIMARY KEY("id")
);
CREATE INDEX IF NOT EXISTS "combos_available_index" ON "combos" (
	"available"
);
CREATE INDEX IF NOT EXISTS "combos_order_count_index" ON "combos" (
	"order_count"
);
CREATE INDEX IF NOT EXISTS "conversations_customer_id_index" ON "conversations" (
	"customer_id"
);
CREATE INDEX IF NOT EXISTS "conversations_last_message_at_index" ON "conversations" (
	"last_message_at"
);
CREATE INDEX IF NOT EXISTS "conversations_order_id_index" ON "conversations" (
	"order_id"
);
CREATE INDEX IF NOT EXISTS "conversations_restaurant_id_index" ON "conversations" (
	"restaurant_id"
);
CREATE INDEX IF NOT EXISTS "conversations_restaurant_id_last_message_at_index" ON "conversations" (
	"restaurant_id",
	"last_message_at"
);
CREATE INDEX IF NOT EXISTS "dishes_available_index" ON "dishes" (
	"available"
);
CREATE INDEX IF NOT EXISTS "dishes_category_id_index" ON "dishes" (
	"category_id"
);
CREATE INDEX IF NOT EXISTS "dishes_restaurant_id_category_id_index" ON "dishes" (
	"restaurant_id",
	"category_id"
);
CREATE INDEX IF NOT EXISTS "dishes_restaurant_id_index" ON "dishes" (
	"restaurant_id"
);
CREATE INDEX IF NOT EXISTS "inventory_nodes_category_id_index" ON "inventory_nodes" (
	"category_id"
);
CREATE INDEX IF NOT EXISTS "inventory_nodes_entity_type_index" ON "inventory_nodes" (
	"entity_type"
);
CREATE INDEX IF NOT EXISTS "inventory_nodes_restaurant_id_index" ON "inventory_nodes" (
	"restaurant_id"
);
CREATE INDEX IF NOT EXISTS "menu_categories_display_order_index" ON "menu_categories" (
	"display_order"
);
CREATE INDEX IF NOT EXISTS "menu_categories_restaurant_id_index" ON "menu_categories" (
	"restaurant_id"
);
CREATE INDEX IF NOT EXISTS "messages_conversation_id_created_at_index" ON "messages" (
	"conversation_id",
	"created_at"
);
CREATE INDEX IF NOT EXISTS "messages_conversation_id_index" ON "messages" (
	"conversation_id"
);
CREATE INDEX IF NOT EXISTS "messages_created_at_index" ON "messages" (
	"created_at"
);
CREATE INDEX IF NOT EXISTS "messages_sender_id_index" ON "messages" (
	"sender_id"
);
CREATE INDEX IF NOT EXISTS "order_items_order_id_index" ON "order_items" (
	"order_id"
);
CREATE INDEX IF NOT EXISTS "order_items_orderable_index" ON "order_items" (
	"orderable_type",
	"orderable_id"
);
CREATE INDEX IF NOT EXISTS "orders_created_at_index" ON "orders" (
	"created_at"
);
CREATE INDEX IF NOT EXISTS "orders_restaurant_id_created_at_index" ON "orders" (
	"restaurant_id",
	"created_at"
);
CREATE INDEX IF NOT EXISTS "orders_restaurant_id_index" ON "orders" (
	"restaurant_id"
);
CREATE INDEX IF NOT EXISTS "orders_restaurant_id_status_index" ON "orders" (
	"restaurant_id",
	"status"
);
CREATE INDEX IF NOT EXISTS "orders_status_index" ON "orders" (
	"status"
);
CREATE INDEX IF NOT EXISTS "orders_user_id_index" ON "orders" (
	"user_id"
);
CREATE INDEX IF NOT EXISTS "personal_access_tokens_expires_at_index" ON "personal_access_tokens" (
	"expires_at"
);
CREATE UNIQUE INDEX IF NOT EXISTS "personal_access_tokens_token_unique" ON "personal_access_tokens" (
	"token"
);
CREATE INDEX IF NOT EXISTS "personal_access_tokens_tokenable_type_tokenable_id_index" ON "personal_access_tokens" (
	"tokenable_type",
	"tokenable_id"
);
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_unique" ON "users" (
	"email"
);
CREATE UNIQUE INDEX IF NOT EXISTS "users_phone_unique" ON "users" (
	"phone"
);
COMMIT;
