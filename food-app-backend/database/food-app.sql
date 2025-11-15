-- ==============================================================
--  FOOD-APP DATABASE SCHEMA
--  Description:
--    This database powers a Ugandan food-ordering platform that
--    connects verified restaurants and customers. Customers browse
--    nearby restaurants, view their menus (with dish modifiers),
--    place customised orders, and chat directly with restaurants
--    for order confirmations or adjustments. Platform admins
--    verify restaurants and oversee global data.
-- ==============================================================

CREATE DATABASE IF NOT EXISTS food_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE food_app;

-- ==============================================================
--  USERS  (customers, restaurants, platform admins)
-- ==============================================================

CREATE TABLE users (
  id CHAR(26) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(30) UNIQUE,
  password VARCHAR(255),
  role ENUM('customer','restaurant','admin') DEFAULT 'customer',
  profile JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

INSERT INTO users (id, name, email, phone, role) VALUES
('01HZYV9M2VWT9CS1H8KQP7F9AR','Edmond','edmond@example.com','0701000001','admin'),
('01HZYVA1CEM6J3MQTKMTS6MN2H','Mama Naka','mama.naka@foodmail.com','0772000002','restaurant'),
('01HZYVAP6JKD5ST4Y3QNKGF8QD','Grace Namiiro','grace.namiiro@gmail.com','0753000003','customer');

-- ==============================================================
--  RESTAURANTS
-- ==============================================================

CREATE TABLE restaurants (
  id CHAR(26) PRIMARY KEY,
  owner_id CHAR(26) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  phone VARCHAR(30),
  email VARCHAR(255),
  address TEXT,
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  verification_status ENUM('pending','verified','rejected') DEFAULT 'pending',
  config JSON NULL, -- e.g. open hours, logo, delivery radius
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  FOREIGN KEY (owner_id) REFERENCES users(id)
);

INSERT INTO restaurants (id, owner_id, name, description, phone, email, address, latitude, longitude, verification_status)
VALUES
('01HZYVBRP9TVRN1Y9PQXJZ1HT7','01HZYVA1CEM6J3MQTKMTS6MN2H','Mama Naka\'s Kitchen','Traditional Ugandan dishes served hot and fresh.','0772000002','info@mamanaka.ug','Wandegeya, Kampala',0.3476,32.5825,'verified'),
('01HZYVCTE5C2WB8WTKQMSD64XG','01HZYVA1CEM6J3MQTKMTS6MN2H','Kampala Grill','Modern grill and juice bar.','0708123456','hello@kampalagrill.ug','Kabalagala, Kampala',0.3170,32.6030,'pending');

-- ==============================================================
--  MENU CATEGORIES
-- ==============================================================

CREATE TABLE menu_categories (
  id CHAR(26) PRIMARY KEY,
  restaurant_id CHAR(26) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
);

INSERT INTO menu_categories (id, restaurant_id, name, description, display_order)
VALUES
('01HZYVE3ZPQYXTBMWPXJZQQS4G','01HZYVBRP9TVRN1Y9PQXJZ1HT7','Main Dishes','Traditional local meals',1),
('01HZYVEBWMP8J9H44BPM7D42N1','01HZYVBRP9TVRN1Y9PQXJZ1HT7','Drinks','Fresh juices and sodas',2);

-- ==============================================================
--  DISHES
-- ==============================================================

CREATE TABLE dishes (
  id CHAR(26) PRIMARY KEY,
  restaurant_id CHAR(26) NOT NULL,
  category_id CHAR(26) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price INT UNSIGNED NOT NULL DEFAULT 0, -- in UGX
  unit VARCHAR(50) DEFAULT 'plate',
  available TINYINT(1) DEFAULT 1,
  images JSON NULL,
  tags JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id),
  FOREIGN KEY (category_id) REFERENCES menu_categories(id)
);

INSERT INTO dishes (id, restaurant_id, category_id, name, description, price, unit, images, tags)
VALUES
('01HZYVFPE8HD4BCAM4J9SZ3R6P','01HZYVBRP9TVRN1Y9PQXJZ1HT7','01HZYVE3ZPQYXTBMWPXJZQQS4G','Luwombo','Stewed chicken wrapped in banana leaves served with matooke.',15000,'plate','["/images/luwombo.jpg"]','["traditional","chicken"]'),
('01HZYVG3D8K71K6XT1FNGT4KHP','01HZYVBRP9TVRN1Y9PQXJZ1HT7','01HZYVEBWMP8J9H44BPM7D42N1','Passion Fruit Juice','Freshly squeezed local passion fruits.',3000,'glass','["/images/passion.jpg"]','["juice","drink"]');

-- ==============================================================
--  DISH OPTIONS (modifiers / extras)
-- ==============================================================

CREATE TABLE dish_options (
  id CHAR(26) PRIMARY KEY,
  dish_id CHAR(26) NOT NULL,
  name VARCHAR(255) NOT NULL,
  extra_cost INT UNSIGNED DEFAULT 0, -- in UGX
  required TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  FOREIGN KEY (dish_id) REFERENCES dishes(id)
);

INSERT INTO dish_options (id, dish_id, name, extra_cost, required)
VALUES
('01HZYVH8FT8N3H6Z2MWR7FTXMC','01HZYVFPE8HD4BCAM4J9SZ3R6P','Add Groundnut Sauce',2000,0),
('01HZYVHHNT3YCTH1Q8D4Z4KKTF','01HZYVFPE8HD4BCAM4J9SZ3R6P','Extra Matooke',1500,0);

-- ==============================================================
--  ORDERS
-- ==============================================================

CREATE TABLE orders (
  id CHAR(26) PRIMARY KEY,
  user_id CHAR(26) NOT NULL,
  restaurant_id CHAR(26) NOT NULL,
  total INT UNSIGNED NOT NULL DEFAULT 0, -- in UGX
  status ENUM('pending','confirmed','preparing','ready','completed','cancelled') DEFAULT 'pending',
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
);

INSERT INTO orders (id, user_id, restaurant_id, total, status, notes)
VALUES
('01HZYVJ5G7W4DJYB9H8QXPYTVK','01HZYVAP6JKD5ST4Y3QNKGF8QD','01HZYVBRP9TVRN1Y9PQXJZ1HT7',18000,'pending','Please make it less spicy');

-- ==============================================================
--  ORDER ITEMS
-- ==============================================================

CREATE TABLE order_items (
  id CHAR(26) PRIMARY KEY,
  order_id CHAR(26) NOT NULL,
  dish_id CHAR(26) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price INT UNSIGNED NOT NULL DEFAULT 0,
  total_price INT UNSIGNED NOT NULL DEFAULT 0,
  options JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (dish_id) REFERENCES dishes(id)
);

INSERT INTO order_items (id, order_id, dish_id, quantity, unit_price, total_price, options)
VALUES
('01HZYVKD1TEVZB1HFJH4S42MNT','01HZYVJ5G7W4DJYB9H8QXPYTVK','01HZYVFPE8HD4BCAM4J9SZ3R6P',1,15000,17000,'{"extras":["Add Groundnut Sauce"]}');

-- ==============================================================
--  CONVERSATIONS (between restaurant and customer)
-- ==============================================================

CREATE TABLE conversations (
  id CHAR(26) PRIMARY KEY,
  order_id CHAR(26) NOT NULL,
  customer_id CHAR(26) NOT NULL,
  restaurant_id CHAR(26) NOT NULL,
  status ENUM('active','closed','archived') DEFAULT 'active',
  last_message_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (customer_id) REFERENCES users(id),
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
);

INSERT INTO conversations (id, order_id, customer_id, restaurant_id, status)
VALUES
('01HZYVM9ZCM5QXFRPP0R0MQZ2Y','01HZYVJ5G7W4DJYB9H8QXPYTVK','01HZYVAP6JKD5ST4Y3QNKGF8QD','01HZYVBRP9TVRN1Y9PQXJZ1HT7','active');

-- ==============================================================
--  MESSAGES
-- ==============================================================

CREATE TABLE messages (
  id CHAR(26) PRIMARY KEY,
  conversation_id CHAR(26) NOT NULL,
  sender_id CHAR(26) NOT NULL,
  sender_role ENUM('customer','restaurant','system') DEFAULT 'customer',
  content TEXT,
  read_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id),
  FOREIGN KEY (sender_id) REFERENCES users(id)
);

INSERT INTO messages (id, conversation_id, sender_id, sender_role, content)
VALUES
('01HZYVNNP7Y3J0YTWY8JKJ8C4W','01HZYVM9ZCM5QXFRPP0R0MQZ2Y','01HZYVAP6JKD5ST4Y3QNKGF8QD','customer','Hi, can you make it less spicy please?'),
('01HZYVP1NM2TSN8F1Z4KJPNMJ3','01HZYVM9ZCM5QXFRPP0R0MQZ2Y','01HZYVA1CEM6J3MQTKMTS6MN2H','restaurant','Sure! We can adjust the spice level.');

-- ==============================================================
--  REVIEWS
-- ==============================================================

CREATE TABLE reviews (
  id CHAR(26) PRIMARY KEY,
  user_id CHAR(26) NOT NULL,
  reviewable_type ENUM('restaurant','dish') NOT NULL,
  reviewable_id CHAR(26) NOT NULL,
  rating INT CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

INSERT INTO reviews (id, user_id, reviewable_type, reviewable_id, rating, comment)
VALUES
('01HZYVQJ13V7WK71V7FWMFYNH8','01HZYVAP6JKD5ST4Y3QNKGF8QD','restaurant','01HZYVBRP9TVRN1Y9PQXJZ1HT7',5,'Excellent traditional meals and friendly service!'),
('01HZYVRWMF7DN7X03C2GH71G92','01HZYVAP6JKD5ST4Y3QNKGF8QD','dish','01HZYVFPE8HD4BCAM4J9SZ3R6P',5,'The Luwombo was perfectly done!');

-- ==============================================================
--  INVENTORY NODES  (visual kitchen arrangement)
-- ==============================================================

CREATE TABLE inventory_nodes (
  id CHAR(26) PRIMARY KEY,
  restaurant_id CHAR(26) NOT NULL,
  entity_type ENUM('ingredient','dish','station') NOT NULL,
  entity_id CHAR(26) NULL,
  display_name VARCHAR(255),
  x INT DEFAULT 0,
  y INT DEFAULT 0,
  color_code VARCHAR(10),
  metadata JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
);

INSERT INTO inventory_nodes (id, restaurant_id, entity_type, entity_id, display_name, x, y, color_code)
VALUES
('01HZYVTK21D6W5MN8VMMTQPQJX','01HZYVBRP9TVRN1Y9PQXJZ1HT7','dish','01HZYVFPE8HD4BCAM4J9SZ3R6P','Luwombo Station',10,15,'#F5A623'),
('01HZYVTX8YTPR69T9SJ1S4TZX2','01HZYVBRP9TVRN1Y9PQXJZ1HT7','station',NULL,'Grill Area',25,5,'#50E3C2');

-- ==============================================================
--  INVENTORY NODE EDGES
-- ==============================================================

CREATE TABLE inventory_node_edges (
  id CHAR(26) PRIMARY KEY,
  restaurant_id CHAR(26) NOT NULL,
  source_node_id CHAR(26) NOT NULL,
  target_node_id CHAR(26) NOT NULL,
  label VARCHAR(255),
  metadata JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id),
  FOREIGN KEY (source_node_id) REFERENCES inventory_nodes(id),
  FOREIGN KEY (target_node_id) REFERENCES inventory_nodes(id)
);

INSERT INTO inventory_node_edges (id, restaurant_id, source_node_id, target_node_id, label)
VALUES
('01HZYVV50SRW8PXG4PNFRGPP8V','01HZYVBRP9TVRN1Y9PQXJZ1HT7','01HZYVTK21D6W5MN8VMMTQPQJX','01HZYVTX8YTPR69T9SJ1S4TZX2','Prepared at Grill Area');
