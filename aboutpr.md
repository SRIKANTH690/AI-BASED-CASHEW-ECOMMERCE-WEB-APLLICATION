# Panruti Premium Cashews — AI-Based E-Commerce Web Application
## Complete Project Documentation

---

## 1. PROJECT OVERVIEW

This is a full-stack web application for a cashew marketplace based in Panruti, Tamil Nadu. It connects three types of users:

- **Farmers** — upload their cashew products with images
- **Admin** — review, analyse with AI, approve or reject products
- **Customers** — browse approved products, add to cart, and place orders

The unique feature is an **AI Quality Inspection System** — when a farmer uploads a cashew image, a trained machine learning model automatically predicts the cashew grade, quality score, and confidence percentage. Only the admin sees this AI result.

---

## 2. TECHNOLOGY STACK

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | HTML, CSS, Vanilla JavaScript | User interface |
| Backend | Node.js + Express.js | REST API server |
| Database | PostgreSQL | Store all data permanently |
| AI Service | Python + FastAPI + scikit-learn | Cashew image analysis |
| Real-time | Socket.io | Live notifications to admin |
| Authentication | JWT (JSON Web Tokens) | Secure login sessions |

---

## 3. PROJECT FOLDER STRUCTURE

```
k:\ccc\
│
├── frontend/                  ← All HTML/CSS/JS files (what users see)
│   ├── index.html             ← Main single-page application
│   ├── login.html             ← Login page
│   ├── register.html          ← Registration page
│   ├── farmer/
│   │   └── index.html         ← Dedicated farmer portal page
│   ├── admin/
│   │   └── index.html         ← Dedicated admin panel page
│   ├── customer/
│   │   └── index.html         ← Dedicated customer portal page
│   ├── css/
│   │   ├── portal.css         ← Shared styles for all portals
│   │   ├── auth.css           ← Login/register page styles
│   │   ├── farmer.css         ← Farmer portal styles
│   │   ├── admin.css          ← Admin portal styles
│   │   └── customer.css       ← Customer portal styles
│   ├── js/
│   │   ├── api.js             ← Central fetch() helper (all API calls)
│   │   ├── farmer.js          ← Farmer portal JavaScript logic
│   │   ├── admin.js           ← Admin portal JavaScript logic
│   │   └── customer.js        ← Customer portal JavaScript logic
│   ├── images/                ← Static images
│   ├── assets/                ← Other assets
│   ├── W180/                  ← Training images for W180 grade
│   ├── W210/                  ← Training images for W210 grade
│   ├── W240/                  ← Training images for W240 grade
│   ├── W450/                  ← Training images for W450 grade
│   ├── WBB/                   ← Training images for Baby Bits grade
│   └── WBROKEN/               ← Training images for Broken grade
│
├── backend/                   ← Node.js server (API + business logic)
│   ├── server.js              ← Main entry point, starts the server
│   ├── package.json           ← npm dependencies list
│   ├── .env                   ← Secret credentials (never committed)
│   ├── routes/
│   │   ├── auth.js            ← /api/register, /api/login
│   │   ├── farmer.js          ← /api/farmer/upload, /api/farmer/products
│   │   ├── admin.js           ← /api/admin/pending, approve, reject etc.
│   │   └── customer.js        ← /api/customer/products, orders
│   ├── controllers/
│   │   ├── authController.js  ← Register and login logic
│   │   ├── productController.js ← Upload, approve, reject, AI analyse
│   │   ├── orderController.js ← Place order, get orders
│   │   └── enquiryController.js ← Contact form submissions
│   ├── models/
│   │   ├── userModel.js       ← Database queries for users
│   │   ├── productModel.js    ← Database queries for products
│   │   └── orderModel.js      ← Database queries for orders
│   ├── middleware/
│   │   └── auth.js            ← JWT verification + role checking
│   ├── config/
│   │   └── multer.js          ← Image upload configuration
│   ├── database/
│   │   ├── db.js              ← PostgreSQL connection pool
│   │   └── schema.sql         ← Table creation SQL
│   └── uploads/               ← Farmer uploaded images stored here
│
├── ai-service/                ← Python FastAPI microservice
│   ├── main.py                ← FastAPI server with /predict endpoint
│   ├── train.py               ← Model training script
│   ├── predict.py             ← Load model and make predictions
│   ├── requirements.txt       ← Python package dependencies
│   └── model/
│       ├── cashew_model.pkl   ← Trained Random Forest model
│       ├── label_encoder.pkl  ← Grade label mapping
│       └── class_indices.json ← Grade name lookup
│
├── .gitignore                 ← Files excluded from git
├── start.bat                  ← One-click startup script for Windows
└── README.md                  ← Project documentation
```

---

## 4. HOW EACH FILE CONNECTS

### Frontend → Backend Connection
```
index.html
    ↓ loads
js/api.js  (contains API_BASE URL)
    ↓ fetch()
Express.js server (port 5000)
    ↓ routes to
controllers/
    ↓ queries
PostgreSQL database
    ↓ returns JSON
api.js receives response
    ↓ updates
HTML page (DOM)
```

### `api.js` — The Central Connection Hub
This single file handles ALL communication between the frontend and backend. Every API call in the project goes through functions defined here:
- `register()` → POST /api/register
- `login()` → POST /api/login
- `farmerUpload()` → POST /api/farmer/upload
- `adminGetPending()` → GET /api/admin/pending
- `adminApprove(id)` → POST /api/admin/approve/:id
- `getApprovedProducts()` → GET /api/customer/products
- `placeOrder()` → POST /api/customer/orders

### Backend Internal Flow
```
Request arrives at server.js
    ↓
Middleware (CORS, JSON parser)
    ↓
Route file (auth.js / farmer.js / admin.js / customer.js)
    ↓
Middleware: auth.js (verifyToken + requireRole)
    ↓
Controller function
    ↓
Model function (database query)
    ↓
PostgreSQL returns data
    ↓
Controller sends JSON response
```

---

## 5. DATABASE TABLES

### `users` table — All registered accounts
| Column | Type | Purpose |
|---|---|---|
| id | SERIAL | Unique ID |
| name | VARCHAR | Full name |
| email | VARCHAR | Login email |
| password | VARCHAR | Bcrypt hashed password |
| role | VARCHAR | 'farmer', 'customer', or 'admin' |
| phone | VARCHAR | Mobile number |
| created_at | TIMESTAMP | Registration date |

### `farmers` table — Farmer profile details
Linked to `users` table via `user_id`
- village, district, state, pincode
- farm_size, crop_type, experience_years, full_address

### `customers` table — Customer profile details
Linked to `users` table via `user_id`
- customer_name, city, district, state, pincode, address

### `products` table — Cashew listings
- farmer_id (who uploaded it)
- grade, quantity, price, description
- image_url (path to uploaded image)
- latitude, longitude (GPS location)
- prediction_grade, prediction_score, confidence (AI results)
- status: 'pending' → 'approved' or 'rejected'

### `orders` table — Customer purchases
- customer_id, customer_name, customer_email
- total, payment_method
- delivery address details

### `order_items` table — Items in each order
- order_id, product_id, qty, price, product_name, grade

### `enquiries` table — Contact form messages
- name, email, phone, message

---

## 6. HOW THE AI WORKS

### Step 1: Training (done once)
```
python train.py
```
- Reads all images from W180/, W210/, W240/, W450/, WBB/, WBROKEN/ folders
- For each image: resizes to 64×64, extracts colour histograms (54 features per image)
- Trains a Random Forest Classifier with 200 decision trees
- Saves the trained model as `model/cashew_model.pkl`

### Step 2: Prediction (every farmer upload)
```
Farmer uploads image
    ↓
Node.js saves image to uploads/
    ↓
Node.js sends image to Python FastAPI (POST /predict)
    ↓
predict.py loads cashew_model.pkl
    ↓
Image is resized to 64×64 pixels
    ↓
54 colour features are extracted:
  - Red histogram (16 values)
  - Green histogram (16 values)
  - Blue histogram (16 values)
  - Mean & Std of each channel (6 values)
    ↓
200 decision trees each vote on the grade
    ↓
Majority vote = predicted grade
    ↓
Returns: { grade, quality_score, confidence% }
    ↓
Node.js stores in PostgreSQL products table
    ↓
Admin sees: grade + score + confidence
    ↓
Farmer NEVER sees the AI score
```

### Why colour features work for cashews
- W180 (premium) — pure white/cream, very uniform
- W320 (popular) — slightly more yellow-beige
- WBB (baby bits) — smaller, darker fragments
- WBROKEN — mixed brown/dark irregular pieces
- Each grade has a distinct colour signature detectable by histogram analysis

### AI Algorithm: Random Forest Classifier
- 200 decision trees built from training images
- Each tree learns different patterns
- All trees vote → majority wins
- More trees = more accurate and stable predictions

---

## 7. AUTHENTICATION SYSTEM

### How JWT (JSON Web Token) works
```
User logs in with email + password
    ↓
Backend verifies password against bcrypt hash in DB
    ↓
Backend creates a JWT token:
  { id, email, role, name } + signed with JWT_SECRET
    ↓
Token sent to browser
    ↓
Browser stores in localStorage as 'cashew_token'
    ↓
Every API request sends: Authorization: Bearer <token>
    ↓
Backend verifyToken middleware decodes the token
    ↓
requireRole('farmer') checks the role
    ↓
Request allowed or blocked
```

### Three Roles
- **farmer** — can upload products, view own submissions
- **customer** — can browse marketplace, add to cart, place orders
- **admin** — can see pending products, AI analyse, approve/reject, view all data

---

## 8. REAL-TIME NOTIFICATIONS (Socket.io)

When a farmer uploads a product:
```
Product saved to database
    ↓
Node.js emits: io.to('admin_room').emit('new_product_pending', data)
    ↓
Admin's browser receives the event
    ↓
Toast notification appears: "New submission from [farmer name]"
    ↓
Pending list refreshes automatically
```

---

## 9. PAYMENT SYSTEM

Three options:
1. **COD** — order placed immediately, pay on delivery
2. **UPI** — QR code generated from UPI ID `selvamsrikanth135-1@okaxis`, customer scans and pays, enters Transaction ID + confirmation checkbox → then order placed
3. **Card/Net Banking** — standard card payment

For UPI specifically:
- QR code is generated using standard UPI deep link format
- Order button is DISABLED until customer enters transaction ID and checks confirmation
- Transaction ID is stored in the order record for admin reference

---

## 10. DEPLOYMENT (Render)

```
GitHub Repository
    ↓
Render reads code automatically when pushed
    ↓
Three services:
  1. panruti cashew backend (Node.js) → serves frontend + API
  2. ai-services (Python) → AI prediction endpoint
  3. cashew-db (PostgreSQL 18) → database
  4. panrutil cashews (Static) → serves frontend files
```

Environment variables set in Render dashboard:
- `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_PORT`
- `JWT_SECRET` — signs login tokens
- `AI_SERVICE_URL` — URL of the Python service
- `NODE_ENV=production` — enables SSL for Render PostgreSQL

---

## 11. QUESTION & ANSWER GUIDE

**Q1: What is this project about?**
A: It is an AI-based cashew e-commerce web application for Panruti, Tamil Nadu. It connects cashew farmers directly with customers, with an admin managing quality control using artificial intelligence.

**Q2: What problem does it solve?**
A: Traditionally, cashew farmers sell through middlemen who take large commissions. This platform eliminates middlemen by letting farmers sell directly to customers. AI quality inspection ensures product authenticity.

**Q3: What are the three user roles?**
A: Farmer (uploads products), Admin (reviews and approves with AI assistance), Customer (browses and purchases).

**Q4: What technology is used for the frontend?**
A: Plain HTML, CSS, and Vanilla JavaScript — no frameworks like React or Angular. This keeps it simple and fast.

**Q5: What is the backend built with?**
A: Node.js with Express.js framework. It handles all API requests, authentication, database operations, and image uploads.

**Q6: What database is used and why?**
A: PostgreSQL — a relational database. It stores users, products, orders, and enquiries with proper relationships between tables using foreign keys.

**Q7: What AI algorithm is used?**
A: Random Forest Classifier from the scikit-learn library. It was trained on thousands of cashew images to classify grades (W180, W210, W240, W450, WBB, WBROKEN).

**Q8: How is the AI model trained?**
A: The train.py script reads images from labelled folders, extracts 54 colour features per image (colour histograms + channel statistics), and trains 200 decision trees. The model is saved as cashew_model.pkl.

**Q9: Why does the farmer not see the AI score?**
A: The AI score is only for the admin's decision-making. Showing it to farmers could lead to manipulation (e.g., farmers adjusting images to game the score). Only the admin sees Grade, Quality Score, and Confidence percentage.

**Q10: How does the UPI payment work?**
A: A QR code is generated from the UPI ID using the standard UPI deep link format. The customer scans it with Google Pay, PhonePe, or Paytm. After paying, they must enter the Transaction ID and tick a confirmation checkbox. Only then does the Place Order button activate.

**Q11: What is JWT and why is it used?**
A: JWT (JSON Web Token) is a secure way to verify logged-in users. After login, the server creates a token with the user's ID and role, signs it with a secret key, and sends it to the browser. Every subsequent request includes this token so the server knows who is making the request without checking the database each time.

**Q12: What is Socket.io used for?**
A: Real-time notifications. When a farmer submits a product, the admin receives an instant browser notification without refreshing the page.

**Q13: How are images stored?**
A: Uploaded images are saved in the `backend/uploads/` folder. The file path is stored in the PostgreSQL database. When retrieved, the path is converted to a full URL for display.

**Q14: What cashew grades does the AI classify?**
A: W180 (King — largest, premium), W210 (Large), W240 (Standard Premium), W450 (Small Whole), WBB (Baby Bits — tiny fragments), WBROKEN (Broken pieces for cooking).

**Q15: How is the project deployed?**
A: On Render.com — a free cloud hosting platform. The Node.js backend and Python AI service run as separate web services. PostgreSQL database is hosted on Render's managed database service.

**Q16: What is the role of api.js in the frontend?**
A: api.js is the central communication file. All fetch() API calls are defined as functions here. Any frontend page that needs to talk to the backend imports and calls these functions instead of writing fetch() code everywhere.

**Q17: How does the admin approve a product?**
A: Admin sees pending products with farmer details, GPS location, product description, and image. Admin can click "Analyse with AI" to get the AI prediction. Based on this and visual inspection, admin clicks Approve (product goes live in marketplace) or Reject (farmer gets notified).

**Q18: What happens when an order is placed?**
A: The order is saved to the `orders` table with customer details. Order items are saved in `order_items` table linking to specific products. The admin can see all orders in the Orders tab. The customer can view their order history.

**Q19: How does GPS work in farmer upload?**
A: The browser's HTML5 Geolocation API captures the device's GPS coordinates when the farmer clicks "Capture My Location." The latitude and longitude are sent with the product upload and stored in the database. Admin sees the GPS location in the pending product card.

**Q20: What makes this project different from normal e-commerce?**
A: The AI quality inspection — no other cashew marketplace uses machine learning to automatically assess product quality from images. Farmers get AI-verified listings, customers get quality-assured products, and the admin gets an intelligent decision-support tool.
