# 🚗 DriveEase — Vehicle Rental System

DriveEase is a full-stack vehicle rental web application that allows users to browse vehicles, search and filter the available fleet, view vehicle details and specifications, create rental bookings, receive booking notifications, download booking receipts, and manage their bookings.

Administrators can manage vehicles, view registered users, monitor bookings, update booking statuses, and track rental revenue through an admin dashboard.

---

## ✨ Features

### 👤 User Features

- User registration and login
- JWT-based authentication
- Browse available vehicles
- Search vehicles by name or brand
- Filter vehicles by type
- View vehicle details
- View vehicle specifications
- Select pickup and return dates
- Select pickup location
- Automatic rental-day calculation
- Automatic price calculation
- Booking confirmation
- Booking confirmation email
- Download booking receipt as PDF
- View personal bookings
- Cancel active bookings
- Cancellation email
- Booking status update emails

### 👑 Admin Features

- Admin authentication
- Admin dashboard
- View total vehicles
- View registered users
- View total bookings
- View rental revenue
- Add vehicles
- Edit vehicles
- Delete vehicles
- Enable/disable vehicle availability
- View all customer bookings
- View pickup locations
- Update booking status
- Automatic email notification when booking status changes
- View registered users

### 📧 Email Notifications

DriveEase uses Gmail SMTP with Nodemailer to send emails to users' registered email addresses.

The application supports:

- Booking confirmation emails
- Booking cancellation emails
- Admin booking status update emails

Email credentials are stored in environment variables and are not included in the GitHub repository.

### 🧾 Booking Receipt

Users can download a PDF receipt after making a booking.

The receipt includes:

- Booking ID
- Customer details
- Vehicle details
- Pickup and return dates
- Pickup location
- Rental duration
- Price per day
- Total booking amount
- Booking status

### 🔐 Security

- JWT authentication
- Password hashing with bcrypt
- Protected user routes
- Protected admin routes
- Role-based authorization
- Server-side booking validation
- Date validation
- Vehicle availability validation
- Booking overlap prevention
- Environment variables for sensitive credentials

---

## 🛠️ Tech Stack

### Frontend

- React.js
- Vite
- HTML
- CSS
- JavaScript
- jsPDF

### Backend

- Node.js
- Express.js
- REST APIs
- Nodemailer

### Database

- MySQL
- XAMPP / MariaDB for local development
- TiDB Cloud for deployed production environment

### Authentication

- JSON Web Tokens (JWT)
- bcryptjs

### Deployment

- Vercel
- GitHub

---

## 🏗️ Project Structure

```text
Vehicle-Rental/

│
├── frontend/
│   ├── src/
│   │   ├── assets/
│   │   │   └── hero.png
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   │
│   ├── package.json
│   └── ...
│
├── backend/
│   ├── middleware/
│   │   └── authMiddleware.js
│   │
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── vehicleRoutes.js
│   │   ├── bookingRoutes.js
│   │   └── adminRoutes.js
│   │
│   ├── db.js
│   ├── emailService.js
│   ├── server.js
│   ├── package.json
│   └── ...
│
├── screenshots/
│   ├── home.png
│   ├── vehicles.png
│   ├── booking.png
│   ├── my-bookings.png
│   └── admin.png
│
└── README.md
```

---

## 📸 Screenshots

### 🏠 Home

![DriveEase Home](screenshots/home.png)

### 🚗 Vehicle Fleet

![Vehicle Fleet](screenshots/vehicles.png)

### 📅 Booking

![Booking](screenshots/booking.png)

### 📋 My Bookings

![My Bookings](screenshots/my-bookings.png)

### 👑 Admin Dashboard

![Admin Dashboard](screenshots/admin.png)

---

## ⚙️ Environment Variables

Create a `.env` file inside the `backend` directory.

Example:

```env
DB_HOST=127.0.0.1
DB_PORT=3307
DB_USER=root
DB_PASSWORD=
DB_NAME=vehicle_rental

PORT=5000

JWT_SECRET=your_jwt_secret

SMTP_USER=your_gmail_address
SMTP_PASS=your_gmail_app_password
EMAIL_FROM=DriveEase <your_gmail_address>
```

For the deployed application, database and email credentials are configured through Vercel environment variables.

**Never commit `.env` or passwords/API keys to GitHub.**

---

## 🚀 Running the Project Locally

### Backend

```bash
cd backend
npm install
node server.js
```

Backend runs on:

```text
http://localhost:5000
```

### Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on:

```text
http://localhost:5173
```

---

## 🗄️ Database

The local development environment uses XAMPP/MariaDB.

The deployed application uses TiDB Cloud.

The main database tables are:

- `users`
- `vehicles`
- `bookings`

Bookings store the selected vehicle, customer, rental dates, pickup location, total price, and booking status.

---

## 🔄 Booking Flow

```text
Browse Vehicles
      ↓
Select Vehicle
      ↓
Choose Rental Dates
      ↓
Choose Pickup Location
      ↓
Confirm Booking
      ↓
Booking Saved
      ↓
Email Confirmation
      ↓
Download PDF Receipt
```

---

## 👑 Admin Flow

```text
Admin Login
     ↓
Admin Dashboard
     ↓
Manage Vehicles
     ↓
View Customer Bookings
     ↓
Update Booking Status
     ↓
User Receives Email Notification
```

---

## 📌 Project Status

DriveEase is completed as a full-stack vehicle rental project for the BSVS Career Launch Internship 2026.

The project includes user authentication, vehicle management, booking management, admin functionality, email notifications, PDF receipts, database integration, and deployment.

---

## 👨‍💻 Author

**Kishor Naredla**

Built as part of the **BSVS Career Launch Internship 2026 — Full Stack Development**.
