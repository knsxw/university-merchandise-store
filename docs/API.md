# 📚 Backend REST API Reference

This document provides detailed API specifications, request/response schemas, JSON payloads, and error codes for the **Smart University Merchandise Store** backend.

---

## 🌐 General Information

### Base URLs
- **Local Development**: `http://localhost:5000/api`
- **Docker Compose (via Nginx)**: `http://localhost/api`
- **Production (HTTPS)**: `https://<domain>/api`

### Content Type
All POST, PUT, and PATCH requests expect:
```http
Content-Type: application/json
```
All responses return JSON payloads with standard HTTP status codes.

---

## 🔐 Authentication & Role-Based Access Control (RBAC)

The API enforces authorization via headers:

| Scheme | Header | Description |
| :--- | :--- | :--- |
| **Public** | None | Endpoint is accessible without authentication. |
| **Bearer Token (JWT)** | `Authorization: Bearer <token>` | Issued upon Microsoft Entra ID or dev login. Token contains `userId`, `roleName`, `email`, and `department`. Valid for 7 days by default. |
| **Partner API Key** | `x-api-key: <key>` | Authenticates external partner university systems. Validated against `PARTNER_EXPOSED_API_KEY`. |

### Roles & Permissions
- **Student**:
  - Browse merchandise catalog and categories
  - Manage personal shopping cart
  - Checkout orders (eligible for department discounts if university department matches product)
  - View own order history
- **Staff**:
  - All Student permissions
  - Create, update, and delete products
  - Generate AI product descriptions via OpenAI GPT
  - Import products in bulk (up to 500 items via `.xlsx`/`.csv`/JSON)
  - View all customer orders and update fulfillment status
- **Admin**:
  - Full system permissions
  - Manage users, reassign roles, update departments
  - View and update site settings (OpenAI API key, model, endpoint)

---

## 📑 Table of Contents
1. [System & Health](#1-system--health)
2. [Authentication](#2-authentication-apiauth)
3. [Products & Catalog](#3-products--catalog-apiproducts)
4. [Shopping Cart](#4-shopping-cart-apicart)
5. [Orders & Checkout](#5-orders--checkout-apiorders)
6. [User & Role Management](#6-user--role-management-apiusers)
7. [Site Settings & AI Provider](#7-site-settings--ai-provider-apisettings)
8. [Campus Weather Recommendations](#8-campus-weather-recommendations-consuming-public-api)
9. [Partner / Peer University System API](#9-partner--peer-university-system-api-exposing-protected-api)
10. [Error Handling & Status Codes](#10-error-handling--status-codes)

---

### 1. System & Health

#### `GET /api/health`
Health check endpoint to verify backend service availability.
- **Access**: Public
- **Headers**: None
- **Response `200 OK`**:
  ```json
  {
    "status": "healthy",
    "timestamp": "2026-09-25T15:30:00.000Z",
    "service": "Smart University Merchandise Store API"
  }
  ```

---

### 2. Authentication (`/api/auth`)

#### `POST /api/auth/microsoft`
Authenticates via Microsoft Entra ID (Azure AD). In production, verifies the RS256 `idToken` using tenant JWKS, creates or updates the user record, and returns a signed application JWT.
- **Access**: Public
- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "idToken": "<microsoft_entra_id_token>"
  }
  ```
  *(Development fallback accepts `{ "email": "user@university.edu", "name": "Jane Doe", "department": "Computer Science" }` when Entra ID is unconfigured).*
- **Response `200 OK`**:
  ```json
  {
    "message": "Microsoft Entra ID authentication successful",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "name": "Jane Doe",
      "email": "user@university.edu",
      "role": "Student",
      "department": "Computer Science",
      "microsoftId": "00000000-0000-0000-0000-000000000000"
    }
  }
  ```
- **Error Responses**:
  - `401 Unauthorized`: Malformed, invalid, or expired ID token.
  - `403 Forbidden`: Unverified profile login disabled in production.
  - `503 Service Unavailable`: Entra ID is not configured on the server.

#### `POST /api/auth/dev-login`
Instant role switching for local development and rapid testing. Disabled automatically when `NODE_ENV=production` or when real Entra ID is active.
- **Access**: Public (Dev Mode Only)
- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "roleName": "Admin",
    "email": "admin@university.edu"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "message": "Switched to role Admin",
    "token": "eyJhbGciOiJIUzI1Ni...",
    "user": {
      "id": 1,
      "name": "System Admin",
      "email": "admin@university.edu",
      "role": "Admin",
      "department": "IT Services",
      "microsoftId": "ms-admin"
    }
  }
  ```
- **Error Responses**:
  - `403 Forbidden`: Dev login is disabled in production or when Entra ID is configured.
  - `404 Not Found`: Target user email not found in database.

#### `GET /api/auth/me`
Fetches the current user profile from the database using the supplied JWT.
- **Access**: Authenticated (`Bearer <JWT>`)
- **Headers**: `Authorization: Bearer <token>`
- **Response `200 OK`**:
  ```json
  {
    "user": {
      "id": 1,
      "name": "Khine Khant",
      "email": "khine.k@university.edu",
      "role": "Student",
      "department": "Computer Science",
      "microsoftId": "ms-student-1"
    }
  }
  ```
- **Error Responses**:
  - `401 Unauthorized`: Invalid or expired JWT token.
  - `404 Not Found`: User no longer exists in database.

---

### 3. Products & Catalog (`/api/products`)

#### `GET /api/products`
Retrieves products with optional filtering and search parameters.
- **Access**: Public
- **Query Parameters**:
  - `categoryId` *(number, optional)*: Filter by category ID.
  - `search` *(string, optional)*: Search substring against product name or description.
  - `department` *(string, optional)*: Filter by department affiliation (e.g. `Computer Science`).
- **Response `200 OK`**:
  ```json
  {
    "products": [
      {
        "id": 1,
        "name": "University Varsity Bomber Jacket",
        "description": "Exclusive Computer Science Department premium bomber jacket.",
        "price": "1290.00",
        "stock": 25,
        "imageUrl": "https://images.unsplash.com/...",
        "department": "Computer Science",
        "discountPct": "20.00",
        "categoryId": 1,
        "category": {
          "id": 1,
          "name": "Apparel & Clothing"
        },
        "creator": {
          "id": 2,
          "name": "Store Staff Member",
          "email": "staff@university.edu"
        }
      }
    ]
  }
  ```

#### `GET /api/products/categories`
Retrieves all merchandise categories along with total product counts.
- **Access**: Public
- **Response `200 OK`**:
  ```json
  {
    "categories": [
      {
        "id": 1,
        "name": "Apparel & Clothing",
        "description": "Official hoodies, jackets, and t-shirts",
        "_count": { "products": 8 }
      },
      {
        "id": 2,
        "name": "Stationery & Supplies",
        "description": "Notebooks, pens, and accessories",
        "_count": { "products": 4 }
      }
    ]
  }
  ```

#### `GET /api/products/:id`
Retrieves single product details by integer ID.
- **Access**: Public
- **Path Parameters**:
  - `id` *(number, required)*: Product primary key ID.
- **Response `200 OK`**:
  ```json
  {
    "product": {
      "id": 1,
      "name": "University Varsity Bomber Jacket",
      "description": "Exclusive Computer Science Department premium bomber jacket.",
      "price": "1290.00",
      "stock": 25,
      "imageUrl": "https://images.unsplash.com/...",
      "department": "Computer Science",
      "discountPct": "20.00",
      "categoryId": 1,
      "category": { "id": 1, "name": "Apparel & Clothing" },
      "creator": { "id": 2, "name": "Store Staff Member", "email": "staff@university.edu" }
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Product ID must be a positive integer.
  - `404 Not Found`: Product not found.

#### `POST /api/products`
Creates a new merchandise item in the store.
- **Access**: Staff or Admin (`Bearer <JWT>`)
- **Headers**:
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "name": "Campus Hydro Flask 32oz",
    "description": "Double-wall vacuum insulated stainless steel water bottle.",
    "price": 590,
    "stock": 50,
    "categoryId": 3,
    "imageUrl": "https://example.com/flask.jpg",
    "department": null,
    "discountPct": 0,
    "useAiDescription": false
  }
  ```
  *(If `useAiDescription` is `true` or `description` is omitted, the backend generates copy automatically via OpenAI).*
- **Response `201 Created`**:
  ```json
  {
    "message": "Product created successfully",
    "product": {
      "id": 15,
      "name": "Campus Hydro Flask 32oz",
      "description": "Double-wall vacuum insulated stainless steel water bottle.",
      "price": "590.00",
      "stock": 50,
      "imageUrl": "https://example.com/flask.jpg",
      "department": null,
      "discountPct": "0.00",
      "categoryId": 3,
      "category": { "id": 3, "name": "Drinkware & Accessories" }
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Missing required fields (`name`, `price`, `categoryId`) or invalid numeric values.
  - `401 Unauthorized`: Missing or invalid token.
  - `403 Forbidden`: Insufficient permissions (requires Staff or Admin).

#### `POST /api/products/ai-description`
Generates an AI marketing product description preview without persisting to the database.
- **Access**: Staff or Admin (`Bearer <JWT>`)
- **Headers**:
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "productName": "University Varsity Bomber Jacket",
    "categoryName": "Apparel & Clothing",
    "department": "Computer Science",
    "keywords": ["cyber-blue", "water-resistant", "embroidered"]
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "description": "Exclusive Computer Science Department premium bomber jacket with cyber-blue trim, custom embroidered CS patch, and water-resistant outer shell."
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: `productName` is required.
  - `500 Internal Server Error`: OpenAI service error or API key unconfigured.

#### `POST /api/products/bulk`
Performs an atomic batch import of up to 500 products from structured JSON. If any row contains validation errors, the entire batch transaction is rolled back.
- **Access**: Staff or Admin (`Bearer <JWT>`)
- **Headers**:
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "products": [
      {
        "row": 2,
        "name": "University Classic T-Shirt",
        "description": "100% organic cotton university crest tee.",
        "price": 450,
        "stock": 40,
        "category": "Apparel & Clothing",
        "department": "General",
        "discountPct": 0
      }
    ]
  }
  ```
- **Response `201 Created`**:
  ```json
  {
    "message": "1 products imported successfully",
    "importedCount": 1
  }
  ```
- **Error Responses**:
  - `400 Bad Request`:
    ```json
    {
      "error": "The import contains invalid product rows",
      "errors": [
        { "row": 2, "field": "price", "message": "Price must be a non-negative number" }
      ]
    }
    ```

#### `PUT /api/products/:id`
Updates fields of an existing merchandise item.
- **Access**: Staff or Admin (`Bearer <JWT>`)
- **Headers**:
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- **Path Parameters**: `id` *(number, required)*
- **Request Body**: Any subset of `{ "name", "description", "price", "stock", "categoryId", "imageUrl", "department", "discountPct" }`.
- **Response `200 OK`**:
  ```json
  {
    "message": "Product updated successfully",
    "product": { ... }
  }
  ```

#### `DELETE /api/products/:id`
Deletes a merchandise product from the catalog.
- **Access**: Staff or Admin (`Bearer <JWT>`)
- **Path Parameters**: `id` *(number, required)*
- **Response `200 OK`**:
  ```json
  {
    "message": "Product deleted successfully"
  }
  ```

---

### 4. Shopping Cart (`/api/cart`)

All cart endpoints require user authentication (`Bearer <JWT>`). Carts are scoped per user.

#### `GET /api/cart`
Retrieves the user's active shopping cart, items with product details, total item count, and calculated subtotal.
- **Access**: Authenticated (`Bearer <JWT>`)
- **Response `200 OK`**:
  ```json
  {
    "cart": {
      "id": 1,
      "items": [
        {
          "id": 10,
          "cartId": 1,
          "productId": 2,
          "quantity": 1,
          "product": {
            "id": 2,
            "name": "Computer Science Department Varsity Jacket",
            "price": "1290.00",
            "stock": 25,
            "imageUrl": "https://images.unsplash.com/...",
            "category": { "name": "Apparel & Clothing" }
          }
        }
      ],
      "itemCount": 1,
      "subtotal": 1290
    }
  }
  ```

#### `POST /api/cart/add`
Adds a product to the cart or increments its quantity if already present. Checks stock limits.
- **Access**: Authenticated (`Bearer <JWT>`)
- **Request Body**:
  ```json
  {
    "productId": 2,
    "quantity": 1
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "message": "Item added to cart successfully"
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: If requested quantity exceeds available inventory.
  - `404 Not Found`: Product not found.

#### `PUT /api/cart/items/:itemId`
Updates quantity for an existing cart item. If `quantity` is `0`, the item is removed.
- **Access**: Authenticated (`Bearer <JWT>`)
- **Path Parameters**: `itemId` *(number, required)*
- **Request Body**:
  ```json
  {
    "quantity": 2
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "message": "Cart item updated"
  }
  ```

#### `DELETE /api/cart/items/:itemId`
Removes a single item from the cart.
- **Access**: Authenticated (`Bearer <JWT>`)
- **Path Parameters**: `itemId` *(number, required)*
- **Response `200 OK`**:
  ```json
  {
    "message": "Item removed from cart"
  }
  ```

#### `DELETE /api/cart/clear`
Clears all items in the authenticated user's cart.
- **Access**: Authenticated (`Bearer <JWT>`)
- **Response `200 OK`**:
  ```json
  {
    "message": "Cart cleared successfully"
  }
  ```

---

### 5. Orders & Checkout (`/api/orders`)

#### `POST /api/orders/checkout`
Executes an atomic checkout transaction:
1. Validates real-time inventory for every cart item.
2. Applies department discounts if the user's department matches product department affiliation (e.g. 20% discount for Computer Science students buying CS merchandise).
3. Decrements product stock atomically.
4. Creates order and order item records with status `PENDING`.
5. Clears the user's shopping cart.
- **Access**: Authenticated (`Bearer <JWT>`)
- **Response `201 Created`**:
  ```json
  {
    "message": "Order created successfully",
    "order": {
      "id": 101,
      "userId": 3,
      "totalPrice": "1032.00",
      "discountApplied": "258.00",
      "status": "PENDING",
      "createdAt": "2026-09-25T15:45:00.000Z",
      "items": [
        {
          "id": 201,
          "productId": 2,
          "quantity": 1,
          "price": "1032.00",
          "product": {
            "name": "Computer Science Department Varsity Jacket"
          }
        }
      ]
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Cannot checkout with an empty cart.
  - `409 Conflict`: Insufficient stock for one or more items during checkout.

#### `GET /api/orders/my-orders`
Retrieves order history for the currently logged-in student or staff member.
- **Access**: Authenticated (`Bearer <JWT>`)
- **Response `200 OK`**:
  ```json
  {
    "orders": [
      {
        "id": 101,
        "totalPrice": "1032.00",
        "discountApplied": "258.00",
        "status": "PENDING",
        "createdAt": "2026-09-25T15:45:00.000Z",
        "items": [ ... ]
      }
    ]
  }
  ```

#### `GET /api/orders`
Retrieves all orders across all users with cumulative revenue summary.
- **Access**: Staff or Admin (`Bearer <JWT>`)
- **Response `200 OK`**:
  ```json
  {
    "orders": [ ... ],
    "summary": {
      "totalOrders": 14,
      "totalRevenue": 15840.00
    }
  }
  ```

#### `PUT /api/orders/:id/status`
Updates the fulfillment lifecycle status of an order.
- **Access**: Staff or Admin (`Bearer <JWT>`)
- **Path Parameters**: `id` *(number, required)*
- **Request Body**:
  ```json
  {
    "status": "COMPLETED"
  }
  ```
  *Allowed status values: `PENDING`, `PROCESSING`, `COMPLETED`, `CANCELLED`.*
- **Response `200 OK`**:
  ```json
  {
    "message": "Order status updated successfully",
    "order": { ... }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Invalid status value provided.

---

### 6. User & Role Management (`/api/users`)

#### `GET /api/users`
Lists all registered university store users with role details and order counts.
- **Access**: Admin (`Bearer <JWT>`)
- **Response `200 OK`**:
  ```json
  {
    "users": [
      {
        "id": 1,
        "name": "System Admin",
        "email": "admin@university.edu",
        "department": "IT Services",
        "roleId": 1,
        "role": {
          "id": 1,
          "roleName": "Admin",
          "description": "Full system administrator access"
        },
        "_count": { "orders": 2 }
      }
    ]
  }
  ```

#### `GET /api/users/roles`
Retrieves all RBAC roles available in the system.
- **Access**: Admin (`Bearer <JWT>`)
- **Response `200 OK`**:
  ```json
  {
    "roles": [
      { "id": 1, "roleName": "Admin", "description": "Full system administrator access" },
      { "id": 2, "roleName": "Staff", "description": "Can manage products and orders" },
      { "id": 3, "roleName": "Student", "description": "Can browse and place orders" }
    ]
  }
  ```

#### `PUT /api/users/:id`
Updates a user's role assignment or department affiliation.
- **Access**: Admin (`Bearer <JWT>`)
- **Path Parameters**: `id` *(number, required)*
- **Request Body**:
  ```json
  {
    "roleId": 2,
    "department": "Bookstore & Merch"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "message": "User updated successfully",
    "user": { ... }
  }
  ```

---

### 7. Site Settings & AI Provider (`/api/settings`)

#### `GET /api/settings`
Retrieves AI configuration status. The API key is masked for security and never returned in plaintext.
- **Access**: Admin (`Bearer <JWT>`)
- **Response `200 OK`**:
  ```json
  {
    "settings": {
      "ai": {
        "baseUrl": "https://api.openai.com/v1",
        "model": "gpt-4o-mini",
        "apiKeySet": true,
        "apiKeyMasked": "••••••••••••1a2b",
        "source": "database"
      }
    }
  }
  ```

#### `PUT /api/settings`
Configures AI service parameters in the database. Omitted or empty fields retain their existing values.
- **Access**: Admin (`Bearer <JWT>`)
- **Request Body**:
  ```json
  {
    "aiBaseUrl": "https://api.openai.com/v1",
    "aiModel": "gpt-4o-mini",
    "aiApiKey": "sk-proj-..."
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "message": "Site settings saved successfully",
    "settings": { ... }
  }
  ```

---

### 8. Campus Weather Recommendations (Consuming Public API)

#### `GET /api/weather/recommendations`
Consumes the external **Open-Meteo Public API** (`https://api.open-meteo.com/v1/forecast`), evaluates campus temperature, precipitation, and WMO weather codes, and returns contextual product recommendations from in-stock merchandise.
- **Access**: Public
- **Headers**: None
- **Caching**: Cached in memory for **10 minutes** to respect Open-Meteo rate limits.
- **Response `200 OK`**:
  ```json
  {
    "coordinates": {
      "latitude": 13.7563,
      "longitude": 100.5018
    },
    "weather": {
      "temperature": 32.5,
      "weatherCode": 0,
      "condition": "Clear Sky",
      "isRaining": false,
      "isCold": false,
      "isHot": true,
      "isSunny": true
    },
    "recommendation": {
      "message": "It is hot and sunny right now. Check out breathable t-shirts and caps!",
      "products": [
        {
          "id": 3,
          "name": "Signature University Cap",
          "price": 320,
          "stock": 60,
          "imageUrl": "https://images.unsplash.com/...",
          "discountPct": null
        }
      ]
    }
  }
  ```
- **Error Responses**:
  - `503 Service Unavailable`: External Open-Meteo service unreachable.

---

### 9. Partner / Peer University System API (Exposing Protected API)

#### `GET /api/products/available`
Provides a secure feed of currently available (in-stock) merchandise for consumption by peer university systems.
- **Access**: Partner API Key
- **Required Header**:
  ```http
  x-api-key: <PARTNER_EXPOSED_API_KEY>
  ```
- **Response `200 OK`**:
  ```json
  [
    {
      "id": 1,
      "name": "Signature University Hoodie",
      "stock": 45,
      "price": 790
    },
    {
      "id": 2,
      "name": "Computer Science Department Varsity Jacket",
      "stock": 25,
      "price": 1290,
      "department": "Computer Science",
      "discountPct": 20
    }
  ]
  ```
- **Error Responses**:
  - `401 Unauthorized`:
    ```json
    {
      "error": "Unauthorized: Missing x-api-key header",
      "message": "This endpoint requires partner API key authentication."
    }
    ```
  - `403 Forbidden`:
    ```json
    {
      "error": "Forbidden: Invalid API key",
      "message": "The provided x-api-key is invalid or unauthorized."
    }
    ```

---

### 10. Error Handling & Status Codes

All errors returned by the backend follow standard HTTP status conventions and structured error formats:

| HTTP Status | Name | Meaning / Cause |
| :--- | :--- | :--- |
| `200 OK` | Success | The request succeeded. |
| `201 Created` | Resource Created | Entity (product, order, etc.) was successfully created. |
| `400 Bad Request` | Validation Error | Missing required body parameters, malformed values, or failed import validations. |
| `401 Unauthorized` | Authentication Missing | Missing, expired, or invalid JWT token or missing `x-api-key`. |
| `403 Forbidden` | Access Denied | Authenticated user lacks the required RBAC role (`Staff` or `Admin`) or wrong API key. |
| `404 Not Found` | Resource Not Found | Target ID does not match any record in the database. |
| `409 Conflict` | Concurrency Conflict | Insufficient stock detected during checkout. |
| `500 Internal Error`| Server Error | Unexpected database or runtime failure. |
| `503 Unavailable` | Service Unavailable | External service (Entra ID JWKS or Open-Meteo) temporarily unreachable. |

#### Standard Error Response Shape:
```json
{
  "error": "Short descriptive error message",
  "details": "Optional additional debugging information"
}
```
