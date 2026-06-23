# 🌌 OmniDrop Pro (v2.0)

**A Zero-Touch, Cinematic File & Clipboard Transfer System across all your devices.**

🌐 **[Live Web App](https://omnidrop-pro.vercel.app/)**  

OmniDrop is a modern, high-speed file synchronization tool designed to transfer files and text between your PC, mobile, and any other device effortlessly. It bridges the gap between different operating systems without requiring any cables, USBs, or account sign-ins on the client side.

![OmniDrop UI](https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/zap.svg)

## 🌟 What's New in v2.0 (Ultimate Update)

- **Multi-User Private Rooms:** Your data is siloed! Enter any 4-digit PIN to instantly create a secure, isolated "Room". Only devices with the exact same PIN can see or share files. 
- **Magic Clipboard (Text Sync):** Seamlessly send URLs, passwords, or text snippets between devices. Copy text on your PC, right-click the OmniDrop Tray Icon, and it instantly appears on your phone!
- **QR Code Pairing:** Skip the PIN entry completely. Tap the QR icon on your web app and scan it with another device to instantly pair them to the same Private Room.
- **PWA Ready (Native App Feel):** Install OmniDrop directly to your phone's Home Screen from Chrome/Safari. It runs full-screen like a native iOS/Android app.
- **Silent System Tray App (Windows):** No more terminal windows! The PC Sync script now runs completely invisibly in the background. Manage it right from the cool red icon in your Windows taskbar.

## ✨ Core Features

- **Zero-Touch PC Sync:** Simply drag and drop files into your designated `Send_to_Phone` folder on Windows, and they instantly appear on your mobile device. 
- **Cinematic Neumorphic UI:** A premium, tactile web interface inspired by modern streaming apps with physical-feeling buttons and smooth hover animations.
- **Auto-Destructing Files:** Privacy first! All uploaded files are automatically purged from the cloud servers within 1 hour of upload, saving storage and protecting data.
- **Full Manual Control:** "Your Data, Your Control." Delete files instantly across all devices using the manual Trash button.

## 🛠️ Tech Stack

- **Frontend:** React, TypeScript, Vite, TailwindCSS, Vite-PWA
- **Backend/Storage:** Supabase (Real-time Cloud Storage)
- **Local Daemon:** Python, Watchdog, Pystray (System Tray), Pyperclip
- **Deployment:** Vercel

## 🚀 How It Works

1. **Launch the App:** Open the Vercel-hosted Web App on any device and enter a 4-digit Room PIN.
2. **Instant Cloud Sync:** Upload any file via the web. It securely uploads to a Supabase bucket under your specific PIN directory.
3. **PC Background Fetch:** The Python System Tray App running on your PC detects the new file and instantly downloads it to your `Phone_Downloads` folder.
4. **PC to Phone:** Drop a file into `Send_to_Phone` on your PC, and it will immediately show up as a clickable "Movie Card" in the web app for your phone to download.

## 🔒 Privacy & Security

We enforce a strict **1-Hour TTL (Time-To-Live)** on all files. Supabase acts merely as a temporary bridge. Files are never stored permanently, ensuring both privacy and efficient storage utilization. Isolated PIN rooms ensure no one else can accidentally see your data.

## ⚙️ Local Setup (For Developers)

### 1. Web Interface (Frontend)
```bash
cd frontend
npm install
npm run dev
```

### 2. PC Sync Daemon (Python)
```bash
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt # (supabase python-dotenv watchdog pystray pillow pyperclip)
```
To run the background tray app smoothly on Windows:
```bash
Start_OmniDrop.bat
```

*Note: Requires a `.env` file in the root directory containing `SUPABASE_URL`, `SUPABASE_KEY`, and your desired `SYNC_PIN`.*

---
*Built with ❤️ for seamless productivity.*
