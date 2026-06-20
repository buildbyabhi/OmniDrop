# 🌌 OmniDrop (formerly AirBridge)

**A Zero-Touch, Cinematic File Transfer System across all your devices.**

OmniDrop is a modern, high-speed file synchronization tool designed to transfer files between your PC, mobile, and any other device effortlessly. It bridges the gap between different operating systems without requiring any cables, USBs, or account sign-ins on the client side.

![OmniDrop UI](https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/zap.svg)

## ✨ Key Features

- **Zero-Touch PC Sync:** Simply drag and drop files into your designated `Send_to_Phone` folder on Windows, and they instantly appear on your mobile device via the web interface. 
- **Cinematic Neumorphic UI:** A premium, tactile web interface inspired by modern streaming apps (like Netflix) with physical-feeling buttons and smooth hover animations.
- **Auto-Destructing Files:** Privacy first! All uploaded files are automatically purged from the cloud servers within 1 hour of upload, saving storage and protecting data.
- **Full Manual Control:** "Your Data, Your Control." Delete files instantly across all devices using the manual Trash button.
- **Background Daemon:** Runs silently on your Windows PC to continuously monitor and fetch files sent from your phone directly into a `Phone_Downloads` folder.

## 🛠️ Tech Stack

- **Frontend:** React, TypeScript, Vite, TailwindCSS
- **Backend/Storage:** Supabase (Real-time Cloud Storage)
- **Local Daemon:** Python, Watchdog (File system event monitoring)
- **Deployment:** Vercel

## 🚀 How It Works

1. **Upload via Web:** Open the Vercel-hosted Web App on any device (e.g., your phone), tap the physical-style upload button, and select a file.
2. **Instant Cloud Sync:** The file is securely beamed to a Supabase bucket.
3. **PC Background Fetch:** The Python Daemon running on your PC detects the new file and instantly downloads it to your `Phone_Downloads` folder.
4. **PC to Phone:** Drop a file into `Send_to_Phone` on your PC, and it will immediately show up as a clickable "Movie Card" in the web app for your phone to download.

## 🔒 Privacy & Security

We enforce a strict **1-Hour TTL (Time-To-Live)** on all files. Supabase acts merely as a temporary bridge. Files are never stored permanently, ensuring both privacy and efficient storage utilization.

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
pip install supabase python-dotenv watchdog
python laptop_daemon\sync_manager.py
```

*Note: Requires a `.env` file with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.*

---
*Built with ❤️ for seamless productivity.*
