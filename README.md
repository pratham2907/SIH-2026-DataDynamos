# 🌾 AgriQueue — Kisan Procurement Management System (KPMS)

> **Digitizing India's Mandis with Weather-Aware Smart Slots, Real-Time Queue Tokens & Instant Direct Bank Transfers (DBT).**  
> *Built for Smart India Hackathon (SIH 2026) by Team DataDynamos.*

---

## 📖 Overview

**AgriQueue (KPMS)** is an all-in-one digital procurement platform designed to eliminate multi-hour mandi queues, transit crop spoilage, and payment delays for Indian farmers. Combining real-time OpenWeather feeds, a 3-tier crop perishability model, live Agmarknet prices, digital weighbridge integration, and direct DBT disbursements, AgriQueue ensures predictable, fair, and transparent harvest procurement.

---

## 🌟 Core Features

- **🌾 Smart Mandi Finder & Weather Engine**: Calculates Net Economic Value (NEV) incorporating destination weather delays, humidity risks, and transport costs to recommend the most profitable mandi.
- **🛡️ 3-Tier Crop Perishability Classification**:
  - 🔴 **High Perishable**: Tomato, Leafy vegetables
  - 🟠 **Medium Perishable**: Potato, Paddy, Soyabean
  - 🟢 **Low Perishable**: Wheat, Maize, Gram, Mustard
- **🥕 Live Mandi Prices & Geospatial Map**: Interactive Leaflet.js map with radius filtering (50km–600km) and real-time Agmarknet commodity price benchmarks.
- **🎟️ Digital Slot Reservation & QR Pass**: Pre-book mandi arrival windows with downloadable QR passes and Brevo email confirmations.
- **🚦 Real-Time Queue Tracking & Public TV Display**: WebSocket-powered live token queue monitor with audio chimes for mandi entrance screens.
- **⚖️ Weighbridge, Quality Assay & Instant DBT**: Digital weight vouchers, moisture deductions, and real-time DBT payout tracking with UTR numbers.
- **🌐 9-Language Multilingual Support**: Reactive dynamic translations across English, हिन्दी, ગુજરાતી, मराठी, ਪੰਜਾਬੀ, বাংলা, தமிழ், తెలుగు, and ಕನ್ನಡ.
- **🤖 Kisan Sahayak AI Copilot**: Real-time AI advisory for crop health, price forecasts, and mandi navigation.

---

## 🔑 User Roles & Portal Access

| Role | Portal Access | Description |
|---|---|---|
| 👨‍🌾 **Farmer** | Farmer Dashboard & Bookings | Access crop registration, mandi NEV comparison, slot reservation, and DBT payout tracking. Register via the Citizen Registration tab. |
| 👮 **Procurement Officer** | Gate Scanner & Weighbridge Console | Verify QR arrival tokens, enter weighbridge tare/gross weights, conduct quality assay, and issue procurement receipts. |
| 🏛️ **Super Admin** | National Command Center & DBT Release | Real-time APMC oversight, MSP rate adjustments, officer allocations, and direct treasury DBT disbursement approval. |

---

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js, Socket.IO, JWT, Multer, BcryptJS
- **Frontend**: Vanilla JS (ES6+ SPA Architecture), Semantic HTML5, CSS3 Glassmorphism
- **Mapping**: Leaflet.js, OpenStreetMap
- **Integrations**: OpenWeatherMap API, Brevo Email API, Data.gov.in (Agmarknet)

---

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/pratham2907/SIH-2026-DataDynamos.git
cd SIH-2026-DataDynamos
npm install
```

### 2. Configure Environment (`.env`)
```env
PORT=7008
NODE_ENV=development
JWT_SECRET=kpms_sih_secure_jwt_token_2026
OPENWEATHER_API_KEY=your_openweather_api_key
BREVO_API_KEY=your_brevo_api_key
BREVO_SENDER_EMAIL=your_verified_sender@email.com
BREVO_SENDER_NAME="AgriQueue KPMS"
```

### 3. Run the App
```bash
npm start
```
Open **`http://localhost:7008`** in your browser.

---

## 🧪 Testing

```bash
# Run automated engine verification tests (8/8 passing)
node test/smart-booking-test.js
```

---

## 👥 Team DataDynamos
- **Hackathon**: Smart India Hackathon (SIH 2026)
- **Domain**: Agriculture, Food Tech & Rural Development
- **License**: MIT
