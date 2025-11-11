# Food Ordering Platform - REST API Documentation

A complete REST API for a Ugandan food ordering platform built with Laravel 11 + Sanctum.

## 📋 Overview

This API connects customers and restaurants, enabling:
- Restaurant browsing and menu management
- Order placement with customizable items
- Real-time chat between customers and restaurants
- Review system for restaurants and dishes
- Admin verification of restaurants

**Currency:** UGX (Uganda Shillings)  
**ID Format:** ULID (26-character strings)  
**Authentication:** Laravel Sanctum token-based

---

## 🚀 Quick Start

### Installation

```bash
# Clone and install dependencies
composer install

# Setup environment
cp .env.example .env
php artisan key:generate

# Run migrations
php artisan migrate

# Start server
php artisan serve
```

### Running Tests

```bash
php artisan test
```

---

## 🔐 Authentication

### Register
```http
POST /api/v1/register
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "0700000000",
  "password": "password",
  "password_confirmation": "password",
  "role": "customer"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "User registered successfully",
  "data": {
    "user": { ... },
    "token": "1|abc123..."
  }
}
```

### Login
```http
POST /api/v1/login
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password"
}
```

### Logout
```http
POST /api/v1/logout
Authorization: Bearer {token}
```

---

## 🏪 Restaurants

### List Verified Restaurants
```http
GET /api/v1/restaurants
```

**Query Parameters:**
- `name` - Filter by restaurant name
- `verification_status` - Filter by status (pending, verified, rejected)

**Response:**
```json
{
  "status": "success",
  "message": "Success",
  "data": [
    {
      "id": "01HZYVBRP9TVRN1Y9PQXJZ1HT7",
      "name": "Mama Naka's Kitchen",
      "description": "Traditional Ugandan dishes",
      "phone": "0772000002",
      "verification_status": "verified",
      "categories": [...],
      "dishes": [...]
    }
  ]
}
```

### Get Restaurant Details
```http
GET /api/v1/restaurants/{id}
```

### Create Restaurant (Auth Required)
```http
POST /api/v1/restaurants
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "name": "My Restaurant",
  "description": "Best food in town",
  "phone": "0700000000",
  "email": "restaurant@example.com",
  "address": "Kampala, Uganda",
  "latitude": 0.3476,
  "longitude": 32.5825
}
```

### Update Restaurant (Auth Required)
```http
PUT /api/v1/restaurants/{id}
Authorization: Bearer {token}
```

### Delete Restaurant (Auth Required)
```http
DELETE /api/v1/restaurants/{id}
Authorization: Bearer {token}
```

---

## 🍽️ Menu Categories

### List Categories
```http
GET /api/v1/menu-categories?restaurant_id={restaurant_id}
```

### Get Category Details
```http
GET /api/v1/menu-categories/{id}
```

### Create Category (Auth Required)
```http
POST /api/v1/menu-categories
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "restaurant_id": "01HZYVBRP9TVRN1Y9PQXJZ1HT7",
  "name": "Main Dishes",
  "description": "Traditional meals",
  "display_order": 1
}
```

---

## 🍲 Dishes

### List Dishes
```http
GET /api/v1/dishes
```

**Query Parameters:**
- `restaurant_id` - Filter by restaurant
- `category_id` - Filter by category
- `available` - Filter by availability (true/false)
- `name` - Search by name

**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "id": "01HZYVFPE8HD4BCAM4J9SZ3R6P",
      "name": "Luwombo",
      "description": "Chicken in banana leaves",
      "price": 15000,
      "unit": "plate",
      "available": true,
      "images": ["/images/luwombo.jpg"],
      "tags": ["traditional", "chicken"],
      "options": [...]
    }
  ]
}
```

### Get Dish Details
```http
GET /api/v1/dishes/{id}
```

### Create Dish (Auth Required)
```http
POST /api/v1/dishes
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "restaurant_id": "01HZYVBRP9TVRN1Y9PQXJZ1HT7",
  "category_id": "01HZYVE3ZPQYXTBMWPXJZQQS4G",
  "name": "Luwombo",
  "description": "Delicious chicken stew",
  "price": 15000,
  "unit": "plate",
  "available": true,
  "images": ["/images/luwombo.jpg"],
  "tags": ["traditional", "chicken"]
}
```

---

## 📦 Orders

### List Orders (Auth Required)
```http
GET /api/v1/orders
Authorization: Bearer {token}
```

**Query Parameters:**
- `restaurant_id` - For restaurant owners to see their orders

### Get Order Details (Auth Required)
```http
GET /api/v1/orders/{id}
Authorization: Bearer {token}
```

### Create Order (Auth Required)
```http
POST /api/v1/orders
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "restaurant_id": "01HZYVBRP9TVRN1Y9PQXJZ1HT7",
  "notes": "Less spicy please",
  "items": [
    {
      "dish_id": "01HZYVFPE8HD4BCAM4J9SZ3R6P",
      "quantity": 1,
      "unit_price": 15000,
      "total_price": 17000,
      "options": {
        "extras": ["Add Groundnut Sauce"]
      }
    }
  ]
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Order created successfully",
  "data": {
    "id": "01HZYVJ5G7W4DJYB9H8QXPYTVK",
    "total": 17000,
    "status": "pending",
    "items": [...]
  }
}
```

### Update Order Status (Auth Required)
```http
PUT /api/v1/orders/{id}
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "status": "confirmed"
}
```

**Valid Statuses:** pending, confirmed, preparing, ready, completed, cancelled

---

## 💬 Conversations & Messages

### List Conversations (Auth Required)
```http
GET /api/v1/conversations
Authorization: Bearer {token}
```

### Get Conversation Details (Auth Required)
```http
GET /api/v1/conversations/{id}
Authorization: Bearer {token}
```

### Send Message (Auth Required)
```http
POST /api/v1/conversations/{conversation_id}/messages
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "sender_role": "customer",
  "content": "Can you make it less spicy?"
}
```

---

## ⭐ Reviews

### List Reviews
```http
GET /api/v1/reviews?reviewable_type=restaurant&reviewable_id={id}
```

**Query Parameters:**
- `reviewable_type` - "restaurant" or "dish"
- `reviewable_id` - ID of the restaurant or dish

### Get Review Details
```http
GET /api/v1/reviews/{id}
```

### Create Review (Auth Required)
```http
POST /api/v1/reviews
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "reviewable_type": "restaurant",
  "reviewable_id": "01HZYVBRP9TVRN1Y9PQXJZ1HT7",
  "rating": 5,
  "comment": "Excellent food and service!"
}
```

### Update Review (Auth Required)
```http
PUT /api/v1/reviews/{id}
Authorization: Bearer {token}
```

### Delete Review (Auth Required)
```http
DELETE /api/v1/reviews/{id}
Authorization: Bearer {token}
```

---

## 📐 Architecture

### Service-Oriented Architecture

```
Controllers → Services → Models → Database
    ↓            ↓
Requests    Business Logic
Resources   Data Formatting
```

**Key Components:**
- **Controllers** - Handle HTTP requests/responses
- **Services** - Contain business logic
- **Form Requests** - Validate input
- **API Resources** - Format JSON responses
- **Models** - Database entities with relationships
- **Policies** - Access control (planned)

### Folder Structure

```
app/
├── Http/
│   ├── Controllers/Api/
│   │   ├── Restaurants/
│   │   ├── Orders/
│   │   ├── Chats/
│   │   └── Reviews/
│   ├── Requests/
│   └── Resources/
├── Models/
├── Services/
└── Traits/
```

---

## 🗄️ Database Schema

**Main Tables:**
- users (customer, restaurant, admin roles)
- restaurants
- menu_categories
- dishes
- dish_options
- orders
- order_items
- conversations
- messages
- reviews
- inventory_nodes
- inventory_node_edges

All tables use ULID primary keys and support soft deletes.

---

## 🧪 Testing

```bash
# Run all tests
php artisan test

# Run specific test
php artisan test --filter=RestaurantApiTest

# Run with coverage
php artisan test --coverage
```

---

## 🔧 Development

### Code Style
```bash
./vendor/bin/pint
```

### Database
```bash
# Fresh migration
php artisan migrate:fresh

# Seed database (if seeders exist)
php artisan db:seed
```

---

## 📝 Response Format

All API responses follow this structure:

### Success Response
```json
{
  "status": "success",
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "status": "error",
  "message": "Error description"
}
```

---

## 🔒 Security

- Token-based authentication via Laravel Sanctum
- CSRF protection disabled for API routes
- Input validation via Form Requests
- SQL injection protection via Eloquent ORM
- XSS protection via Laravel's output escaping

---

## 📄 License

MIT License
