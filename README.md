# Panruti Premium Cashews — AI-Based E-Commerce Web App

## Project Structure
```
AI-Cashew-WebApp/
├── frontend/          ← HTML/CSS/JS frontend (served by Express)
│   ├── index.html     ← Main landing page
│   ├── login.html
│   ├── register.html
│   ├── farmer/        ← Farmer portal
│   ├── admin/         ← Admin portal
│   ├── customer/      ← Customer portal
│   ├── css/
│   ├── js/
│   └── W180/ W210/ W240/ W450/ WBB/ WBROKEN/  ← Dataset
├── backend/           ← Node.js + Express API
│   ├── server.js
│   ├── routes/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── database/
│   │   ├── db.js
│   │   └── schema.sql
│   ├── config/
│   ├── uploads/
│   └── .env
├── ai-service/        ← Python FastAPI AI microservice
│   ├── train.py
│   ├── predict.py
│   ├── main.py
│   ├── requirements.txt
│   └── model/         ← Saved model goes here after training
└── README.md
```

---

## Step 1 — PostgreSQL Setup
```sql
-- In psql or pgAdmin:
CREATE DATABASE cashew;
-- Then run schema:
psql -U postgres -d cashew -f backend/database/schema.sql
```

## Step 2 — Backend Setup
```bash
cd backend
npm install
npm run dev
# Server runs at http://localhost:5000
```

## Step 3 — AI Service Setup
```bash
cd ai-service
pip install -r requirements.txt

# Train the model (run once — uses your dataset folders)
python train.py

# Start the AI service
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
# AI runs at http://localhost:8000
```
ee
## Step 4 — Open the App
Open browser: http://localhost:5000

---

## Default Admin Login
- Email: admin@panruti.com
- Password: password  (change after first login)

---

## API Endpoints

| Method | Endpoint                  | Role     | Description              |
|--------|---------------------------|----------|--------------------------|
| POST   | /api/register             | Public   | Register farmer/customer |
| POST   | /api/login                | Public   | Login, returns JWT       |
| GET    | /api/me                   | Auth     | Get current user         |
| POST   | /api/farmer/upload        | Farmer   | Upload cashew product    |
| GET    | /api/farmer/products      | Farmer   | My submitted products    |
| GET    | /api/customer/products    | Public   | Approved marketplace     |
| POST   | /api/customer/orders      | Customer | Place order              |
| GET    | /api/customer/orders      | Customer | My orders                |
| GET    | /api/admin/pending        | Admin    | Pending submissions      |
| POST   | /api/admin/approve/:id    | Admin    | Approve product          |
| POST   | /api/admin/reject/:id     | Admin    | Reject product           |
| GET    | /api/admin/stats          | Admin    | Dashboard stats          |
| GET    | /api/admin/farmers        | Admin    | All farmers              |
| GET    | /api/admin/customers      | Admin    | All customers            |
| GET    | /api/admin/orders         | Admin    | All orders               |

---

## AI Prediction Flow
1. Farmer uploads image → Node.js saves to `backend/uploads/`
2. Node.js sends image to FastAPI `/predict`
3. FastAPI loads trained model → returns grade, score, confidence
4. Node.js stores prediction in PostgreSQL
5. Admin sees AI prediction alongside farmer submission

## Dataset Grades
| Folder  | Grade   | Price    |
|---------|---------|----------|
| W180    | W180    | ₹1,250/kg |
| W210    | W210    | ₹1,050/kg |
| W240    | W240    | ₹920/kg  |
| W450    | W450    | ₹620/kg  |
| WBB     | WBB     | ₹400/kg  |
| WBROKEN | Broken  | ₹380/kg  |
