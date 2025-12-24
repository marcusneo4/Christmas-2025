# 🎄 Quick Start Guide - Christmas Party Prize Draw 2025

## ✨ What You Have

A fully functional, festive web application for your Christmas party that:
- Randomly selects 10 winners from your participant list
- Features exciting **loot box animations** (like opening blind boxes/mystery boxes)
- Has beautiful Christmas theming with snowflakes and twinkling lights
- Includes sound effects for maximum excitement
- Shows confetti celebrations
- Can export winners list

## 🚀 How to Run (Super Simple!)

### Option 1: Double-Click (Easiest)
1. Simply **double-click** on `index.html`
2. It will open in your default web browser
3. That's it! You're ready to go!

### Option 2: Right-Click
1. Right-click on `index.html`
2. Select "Open with" → Choose your browser (Chrome, Edge, Firefox, etc.)

## 📝 How to Use at Your Party

### Step 1: Add Participants (Choose One Method)

**Method A - Manual Entry:**
- Type or paste names into the text box
- One name per line
- Example:
  ```
  John Smith
  Jane Doe
  Bob Wilson
  ```

**Method B - Upload File:**
- Click "Choose File" button
- Select your CSV or TXT file
- We've included `sample-names.txt` with 90 names for testing!

### Step 2: Start the Draw
- Once you have 10+ names, the red "Start Drawing" button becomes active
- Click it and enjoy the show!

### Step 3: Watch the Magic ✨
Each winner is revealed with:
1. **Shaking Gift Box** (3 seconds of suspense)
2. **Box Bursts Open** with particle explosion
3. **Winner Name Appears** in golden text
4. **Confetti & Celebration**
5. Previous winners shown at bottom

This repeats 10 times (about 90 seconds total)

### Step 4: Final Results
- All 10 winners displayed in beautiful cards
- Continuous confetti celebration
- Click "Download Results" to save the list
- Click "Start New Draw" to run it again

## ⏩ Pro Tips

### Testing Before the Party
1. Use the included `sample-names.txt` file
2. Click the "Skip Animation" button to see results instantly
3. Run it a few times to get comfortable

### For the Actual Party
1. **Prepare your names file in advance** (saves time at the party)
2. **Connect to external speakers** for better sound effects
3. **Project on a large screen/TV** so everyone can see
4. **Test your audio** before guests arrive
5. **Take a screenshot** of results as backup

### If You Need to Speed Up
- Use the "⏩ Skip Animation" button in the bottom-right during the draw
- This instantly shows all results

## 🎨 What Makes This Special

### Loot Box Animation Style
Just like opening mystery boxes or blind boxes in games:
- Beautiful wrapped gift box with golden ribbon
- Shakes and glows with anticipation
- Dramatically bursts open
- Reveals winner with celebration effects

### Christmas Atmosphere
- Animated falling snowflakes
- Colorful twinkling Christmas lights border
- Red, green, and gold color scheme
- Festive fonts and decorations
- Holiday-themed sound effects

### Professional Features
- Fair random selection (Fisher-Yates algorithm)
- No duplicates
- Smooth animations (60 FPS)
- Generated sound effects (no external audio files needed)
- Works offline (no internet required)
- Mobile-friendly design

## 📁 Files Included

- `index.html` - Main application (double-click this!)
- `styles.css` - All the beautiful Christmas styling
- `script.js` - All the interactive functionality
- `README.md` - Detailed documentation
- `sample-names.txt` - 90 test names ready to use
- `QUICK_START_GUIDE.md` - This file

## 🎯 Perfect Setup for Your Party

1. **Before Guests Arrive:**
   - Load your participant names
   - Test the application once
   - Set up projector/large screen
   - Connect speakers

2. **During the Party:**
   - At prize time, gather everyone around
   - Click "Start Drawing"
   - Let the excitement build with each reveal!
   - Download and keep the results

3. **If You Want Multiple Rounds:**
   - Click "Start New Draw" after results
   - Names stay loaded, so you can immediately run again
   - Winners are randomly selected each time

## 🐛 Troubleshooting

**Button is disabled/grayed out:**
- Make sure you have at least 10 names entered

**No sound:**
- Check browser isn't muted
- Check system volume
- Some browsers need you to interact with page first (click anywhere)

**Animations are slow:**
- Close other browser tabs
- Use Chrome or Edge for best performance
- Click "Skip Animation" if needed

**Want to change number of winners:**
- Open `script.js` in a text editor
- Find line 173: `return shuffled.slice(0, 10);`
- Change `10` to your desired number (e.g., `5` or `15`)
- Also update line 326 to match

## 🎉 Have an Amazing Party!

This application was designed to add excitement and fairness to your Christmas celebration. 

The loot box style reveal keeps everyone engaged and builds anticipation for each winner!

**Enjoy your party and happy holidays! 🎅🎄✨**

---

*Created for Christmas 2025*
*No installation required • Works offline • Browser-based*

