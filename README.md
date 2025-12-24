# Soon Family Christmas Lucky Draw 2025 🎄

A beautiful, interactive Christmas lucky draw application with animations, sound effects, and prize reveals!

## 🎁 Features

- **Countdown from 10th to 1st Place** - Build excitement as you reveal winners from smallest to biggest prizes
- **Interactive Loot Box Animation** - Click to open gift boxes with epic visual effects
- **10 Amazing Prizes** - From cozy gifts to the grand prize tablet + $300 cash
- **Sound Effects & Music** - Festive background music and celebration sounds
- **Beautiful Design** - Snowflakes, Christmas lights, and glassmorphism UI
- **Results Export** - Download the winners list as a text file

## 🚀 How to Run

### Method 1: Double-click START_SERVER.bat (Recommended)
Just double-click the `START_SERVER.bat` file and your browser will automatically open the application!

### Method 2: Manual Python Server
```bash
# Open command prompt in this folder and run:
python -m http.server 8080

# Then open browser to:
http://localhost:8080
```

### Method 3: Direct File Opening
Simply double-click `index.html` to open directly in your browser.

## 📋 How to Use

1. **Add Participants**: Enter names (one per line) or upload a CSV/TXT file
2. **Start Draw**: Click "Start Lucky Draw" when you have at least 10 participants
3. **Reveal Winners**: Click each gift box to reveal winners from 10th place to 1st place
4. **View Results**: See all winners with their prizes on the final results screen
5. **Export**: Download the results or start a new draw

## 🏆 Prize List

- **10th Place:** Christmas Mug & Hot Cocoa Set
- **9th Place:** Festive Candle Collection
- **8th Place:** Premium Wine Bottle
- **7th Place:** Gourmet Chocolate Gift Box
- **6th Place:** Cozy Winter Blanket
- **5th Place:** Wireless Bluetooth Speaker
- **4th Place:** $100 Shopping Voucher
- **3rd Place:** Luxury Spa Gift Set
- **2nd Place:** $200 Dining Experience Voucher
- **1st Place:** 🎁 **GRAND PRIZE: Latest Tablet + $300 Cash**

## ⚙️ Customization

To change prize names, edit the `prizes` array in `script.js`:

```javascript
const prizes = [
    "Your 10th Prize",  // 10th place
    "Your 9th Prize",   // 9th place
    // ... etc
    "Your Grand Prize"  // 1st place
];
```

## 🎨 Files

- `index.html` - Main application structure
- `styles.css` - Beautiful Christmas-themed styling
- `script.js` - Interactive animations and draw logic
- `START_SERVER.bat` - Easy server launcher

## 🎄 Enjoy your Christmas Party!

Merry Christmas from the Soon Family! 🎅🎁✨
