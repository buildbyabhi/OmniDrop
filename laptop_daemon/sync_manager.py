import os
import time
import asyncio
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

# Setup Supabase
URL = os.environ.get("SUPABASE_URL", "")
KEY = os.environ.get("SUPABASE_KEY", "")
BUCKET_NAME = "sync_files"
SYNC_PIN = os.environ.get("SYNC_PIN", "1234")

supabase: Client = create_client(URL, KEY)

# Folders
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SEND_FOLDER = os.path.join(BASE_DIR, "Send_to_Phone")
DOWNLOADS_FOLDER = os.path.join(BASE_DIR, "Phone_Downloads")

os.makedirs(SEND_FOLDER, exist_ok=True)
os.makedirs(DOWNLOADS_FOLDER, exist_ok=True)

uploaded_files = set()

class SendFolderHandler(FileSystemEventHandler):
    def on_created(self, event):
        if not event.is_directory:
            filepath = event.src_path
            filename = os.path.basename(filepath)
            print(f"[PC -> Phone] Detected new file: {filename}")
            
            # Wait briefly to ensure file is fully written before uploading
            time.sleep(1)
            
            try:
                with open(filepath, 'rb') as f:
                    supabase.storage.from_(BUCKET_NAME).upload(
                        path=f"{SYNC_PIN}/{filename}",
                        file=f,
                        file_options={"content-type": "application/octet-stream"}
                    )
                print(f"[PC -> Phone] Successfully uploaded {filename} to Room {SYNC_PIN}!")
                uploaded_files.add(filename)
            except Exception as e:
                print(f"Error uploading {filename}: {e}")

async def poll_downloads():
    print(f"Listening for files in Room {SYNC_PIN}... (Auto-Purge Enabled)")
    while True:
        try:
            # List files in the bucket under SYNC_PIN folder
            res = supabase.storage.from_(BUCKET_NAME).list(path=SYNC_PIN)
            
            # If folder doesn't exist or is empty, res might be empty or return an error depending on Supabase API
            if not isinstance(res, list):
                res = []
            
            for file_obj in res:
                filename = file_obj['name']
                
                # Skip placeholder or files we just uploaded
                if filename == ".emptyFolderPlaceholder" or filename in uploaded_files:
                    continue
                
                # 1-Hour Auto Expire Cleanup
                parts = filename.split('_', 1)
                if len(parts) == 2 and parts[0].isdigit():
                    upload_time_ms = int(parts[0])
                    current_time_ms = int(time.time() * 1000)
                    
                    # 1 Hour = 3600000 milliseconds
                    if current_time_ms - upload_time_ms > 3600000:
                        print(f"[Auto-Cleanup] Deleting expired file: {filename}")
                        supabase.storage.from_(BUCKET_NAME).remove([f"{SYNC_PIN}/{filename}"])
                        continue
                
                print(f"[Phone -> PC] New file detected on cloud: {filename}")
                
                # Deep Security Inspection (Quarantine)
                dangerous_exts = {'exe', 'bat', 'cmd', 'vbs', 'js', 'msi', 'sh', 'ps1'}
                parts = filename.lower().split('.')
                
                # Check for double extensions (e.g., virus.exe.jpg)
                has_dangerous_double_ext = any(ext in dangerous_exts for ext in parts)
                
                # Download first to memory buffer
                data = supabase.storage.from_(BUCKET_NAME).download(f"{SYNC_PIN}/{filename}")
                
                # Magic Byte checking (Check if it's an executable disguised as an image)
                is_executable_signature = data.startswith(b'MZ')
                
                is_dangerous = has_dangerous_double_ext or is_executable_signature
                
                safe_filename = filename
                if is_dangerous:
                    safe_filename += ".quarantine"
                    print(f"[SECURITY ALERT] Threat detected in {filename}. Quarantining as {safe_filename}!", flush=True)

                download_path = os.path.join(DOWNLOADS_FOLDER, safe_filename)
                with open(download_path, 'wb') as f:
                    f.write(data)
                
                print(f"[Phone -> PC] Downloaded {safe_filename} to {DOWNLOADS_FOLDER}", flush=True)
                
                # Auto-Purge: Disabled so files stay on the UI longer.
                # supabase.storage.from_(BUCKET_NAME).remove([filename])
                # print(f"[Phone -> PC] Auto-Purged {filename} from cloud to save space.")
                
        except Exception as e:
            print(f"Error polling: {e}", flush=True)
        await asyncio.sleep(3)

def main():
    print("=== AirBridge Laptop Daemon Started ===")
    print(f"Monitoring folder: {SEND_FOLDER}")
    print(f"Downloads folder: {DOWNLOADS_FOLDER}")
    
    # Start Folder Watcher
    event_handler = SendFolderHandler()
    observer = Observer()
    observer.schedule(event_handler, SEND_FOLDER, recursive=False)
    observer.start()
    
    # Start Polling
    try:
        asyncio.run(poll_downloads())
    except KeyboardInterrupt:
        observer.stop()
    observer.join()

if __name__ == "__main__":
    main()
