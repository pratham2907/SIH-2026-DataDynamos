# 🌾 AgriQueue — Kisan Procurement Management System (KPMS)

> **Digitizing India's Mandis with Smart Slots, Weather-Aware Logistics, Real-Time Queue Tokens & Instant Direct Bank Transfers (DBT).**
> 
> *Built for Smart India Hackathon (SIH 2026) by Team DataDynamos.*

---

## 📖 Description

**AgriQueue (KPMS)** is an end-to-end digital procurement platform designed to eliminate multi-hour mandi queues, unfair middlemen exploitation, transit spoilage, and payment delays for Indian farmers. By combining **real-time OpenWeather feeds**, **crop perishability risk modeling**, **AI-driven slot allocation**, **live Agmarknet market rates**, **digital weighbridge vouchers**, and **instant DBT disbursements**, AgriQueue turns chaotic harvest seasons into a transparent, predictable, and fair procurement operation.

---

## 🌟 Key Features

### 1. 🌾 Smart Mandi Procurement Finder
- **Weather-Aware Logistics Engine**: Real-time OpenWeather integration analyzing destination rainfall, humidity, and temperature.
- **3-Tier Crop Perishability Risk Model**:
  - 🔴 **High Perishable**: Tomato, Leafy vegetables
  - 🟠 **Medium Perishable**: Potato, Paddy, Soyabean
  - 🟢 **Low Perishable**: Wheat, Maize, Gram, Mustard
- **Net Economic Value (NEV)**: Calculates produce gross value minus transport and weather-delay risk costs to recommend optimal mandis.

### 2. 🥕 Live Mandi Prices & Geospatial Map
- **Agmarknet & Data.gov.in Live Rates**: Real-time modal prices per quintal and kilogram across vegetables, fruits, and grains.
- **Interactive Leaflet.js Geospatial Map**: Radius filters (50km–600km) with GPS auto-detection and highest-price mandi highlighting.

### 3. 🎟️ Digital Slot Reservation & QR Pass
- Guaranteed procurement time windows eliminating physical rush.
- Downloadable and printable **QR Code Booking Passes** with automated **Brevo Email Confirmations**.

### 4. 🚦 Real-Time Queue & Mandi TV Display
- **Live Socket.IO WebSocket Streaming**: Real-time token caller, estimated wait countdown, and counter assignments.
- **Fullscreen Public TV Display Board**: Designed for mandi gate screens with audio chime callouts.

### 5. ⚖️ Digital Weighbridge, Moisture Testing & Direct DBT
- Moisture analyzer integration with instant weight vouchers.
- **Live UTR & DBT Tracker**: Direct MSP disbursements into Aadhaar-linked farmer bank accounts.

### 6. 🌐 9-Language Multilingual Support
- Seamless, reactive switching across **English**, **हिन्दी (Hindi)**, **ગુજરાતી (Gujarati)**, **मराठी (Marathi)**, **বাংলা (Bengali)**, **ਪੰਜਾਬੀ (Punjabi)**, **தமிழ் (Tamil)**, **తెలుగు (Telugu)**, and **ಕನ್ನಡ (Kannada)**.

### 7. 🤖 Kisan Sahayak AI Copilot
- AI-powered agricultural advice, mandi advisory, and conversational voice assistance.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Backend** | Node.js, Express.js, Socket.IO, Mongoose |
| **Frontend** | Vanilla JS (ES6+), Modern Semantic HTML5, CSS3 Glassmorphism |
| **Mapping & Visuals** | Leaflet.js, OpenStreetMap Tiles, FontAwesome 6 |
| **Integrations** | OpenWeatherMap API, Brevo Email API, Data.gov.in (Agmarknet) |
| **Document Utilities** | PDFKit, QRCode, Multer, BcryptJS, JWT |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18.0.0 or higher)
- **npm** (v9.0.0 or higher)

### 1. Clone the Repository
```bash
git clone https://github.com/pratham2907/SIH-2026-DataDynamos.git
cd SIH-2026-DataDynamos
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory:
```env
PORT=7008
NODE_ENV=development
JWT_SECRET=your_jwt_secret_key
OPENWEATHER_API_KEY=your_openweather_api_key
BREVO_API_KEY=your_brevo_api_key
BREVO_SENDER_EMAIL=your_verified_sender@email.com
BREVO_SENDER_NAME="AgriQueue KPMS"
```

### 4. Run the Application
```bash
# Start server
npm start

# Or with dev watcher
npm run dev
```

Visit **`http://localhost:7008`** in your browser.

---

## 🧪 Testing

Run the automated test suite:
```bash
npm test
```
Or run the dedicated Smart Booking engine tests:
```bash
node test/smart-booking-test.js
```

---

## 👥 Team DataDynamos — Smart India Hackathon
- **Team**: DataDynamos
- **Hackathon**: Smart India Hackathon (SIH 2026)
- **Domain**: Agriculture & Rural Development / Smart Automation
- **License**: MIT
