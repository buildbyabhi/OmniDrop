import os
import time
import asyncio
import threading
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from supabase import create_client, Client
from dotenv import load_dotenv
import pystray
from PIL import Image, ImageDraw
import pyperclip

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))

URL = os.environ.get("SUPABASE_URL", "")
KEY = os.environ.get("SUPABASE_KEY", "")
BUCKET_NAME = "sync_files"
SYNC_PIN = os.environ.get("SYNC_PIN", "1234")

supabase: Client = create_client(URL, KEY)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SEND_FOLDER = os.path.join(BASE_DIR, "Send_to_Phone")
DOWNLOADS_FOLDER = os.path.join(BASE_DIR, "Phone_Downloads")

os.makedirs(SEND_FOLDER, exist_ok=True)
os.makedirs(DOWNLOADS_FOLDER, exist_ok=True)

processed_files = set()
last_clipboard_text = ""

def create_icon_image():
    # Generate a simple red icon
    image = Image.new('RGB', (64, 64), color=(20, 20, 20))
    dc = ImageDraw.Draw(image)
    dc.ellipse((16, 16, 48, 48), fill=(229, 9, 20)) # Red circle like Netflix red
    return image

class SendFolderHandler(FileSystemEventHandler):
    def on_created(self, event):
        if not event.is_directory:
            filepath = event.src_path
            filename = os.path.basename(filepath)
            time.sleep(1)
            try:
                with open(filepath, 'rb') as f:
                    supabase.storage.from_(BUCKET_NAME).upload(
                        path=f"{SYNC_PIN}/{filename}",
                        file=f,
                        file_options={"content-type": "application/octet-stream"}
                    )
                processed_files.add(filename)
            except Exception as e:
                pass

async def poll_downloads():
    global last_clipboard_text
    while True:
        try:
            res = supabase.storage.from_(BUCKET_NAME).list(path=SYNC_PIN)
            if not isinstance(res, list):
                res = []
            
            for file_obj in res:
                filename = file_obj['name']
                
                # Check for clipboard
                if filename == "clipboard.txt":
                    data = supabase.storage.from_(BUCKET_NAME).download(f"{SYNC_PIN}/clipboard.txt")
                    text = data.decode('utf-8')
                    if text != last_clipboard_text:
                        last_clipboard_text = text
                        pyperclip.copy(text) # Sync to PC clipboard
                    continue

                if filename == ".emptyFolderPlaceholder" or filename in processed_files:
                    continue
                
                parts = filename.split('_', 1)
                if len(parts) == 2 and parts[0].isdigit():
                    upload_time_ms = int(parts[0])
                    current_time_ms = int(time.time() * 1000)
                    if current_time_ms - upload_time_ms > 3600000:
                        supabase.storage.from_(BUCKET_NAME).remove([f"{SYNC_PIN}/{filename}"])
                        continue
                
                dangerous_exts = {'exe', 'bat', 'cmd', 'vbs', 'js', 'msi', 'sh', 'ps1'}
                exts = filename.lower().split('.')
                has_dangerous = any(ext in dangerous_exts for ext in exts)
                
                data = supabase.storage.from_(BUCKET_NAME).download(f"{SYNC_PIN}/{filename}")
                is_executable = data.startswith(b'MZ')
                
                safe_filename = filename
                if has_dangerous or is_executable:
                    safe_filename += ".quarantine"

                download_path = os.path.join(DOWNLOADS_FOLDER, safe_filename)
                with open(download_path, 'wb') as f:
                    f.write(data)
                
                processed_files.add(filename)

        except Exception as e:
            pass
        await asyncio.sleep(3)

def run_sync_loop():
    event_handler = SendFolderHandler()
    observer = Observer()
    observer.schedule(event_handler, SEND_FOLDER, recursive=False)
    observer.start()
    
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(poll_downloads())

# Pystray Menu Actions
def on_open_send(icon, item):
    os.startfile(SEND_FOLDER)

def on_open_downloads(icon, item):
    os.startfile(DOWNLOADS_FOLDER)

def on_quit(icon, item):
    icon.stop()
    os._exit(0)

def main():
    # Start sync daemon in background thread
    sync_thread = threading.Thread(target=run_sync_loop, daemon=True)
    sync_thread.start()

    # Start System Tray Icon in main thread
    icon = pystray.Icon("OmniDrop")
    icon.menu = pystray.Menu(
        pystray.MenuItem(f"Room: {SYNC_PIN}", lambda: None, enabled=False),
        pystray.Menu.SEPARATOR,
        pystray.MenuItem("Open Send Folder", on_open_send),
        pystray.MenuItem("Open Downloads", on_open_downloads),
        pystray.Menu.SEPARATOR,
        pystray.MenuItem("Quit", on_quit)
    )
    icon.icon = create_icon_image()
    icon.title = "OmniDrop Sync Running"
    icon.run()

if __name__ == "__main__":
    main()
