
import requests
import base64
import os
import sys
import time

# Configuration
BASE_URL = "http://localhost:5000"
COVER_PATH = r"C:\Users\tarun\OneDrive\Desktop\Cover.png"
SECRET_PATH = r"C:\Users\tarun\OneDrive\Desktop\Captures\fox.jpg"
OUTPUT_PATH = r"C:\Users\tarun\OneDrive\Desktop\StegoChat_Decoded_Encrypted.png"

def run_demo():
    print(f"=== StegoChat Persistence & Encryption Demo ===")
    print(f"Target Backend: {BASE_URL}")
    
    # Check files
    if not os.path.exists(COVER_PATH):
        print(f"ERROR: Cover file not found at {COVER_PATH}")
        return

    # 1. ENCODE WITH ENCRYPTION
    print("\n[1] Sending encrypted text message...")
    start_time = time.time()
    try:
        files = {
            'cover_image': ('cover.png', open(COVER_PATH, 'rb'), 'image/png'),
        }
        data = {
            'secret_text': 'This is a TOP SECRET classified message.',
            'password': 'mysecretpassword123',
            'sender': 'Agent 007',
            'receiver': 'Q'
        }
        
        response = requests.post(f"{BASE_URL}/encode_message", files=files, data=data)
        
        if response.status_code != 200:
            print(f"FAILED: {response.text}")
            return
            
        json_data = response.json()
        stego_url = json_data.get('stego_image') # Now returns /storage/filename
        msg_id = json_data.get('id')
        
        elapsed = time.time() - start_time
        print(f"✅ Encoded & Saved! ID: {msg_id}")
        print(f"   Stego URL: {stego_url}")
        
    except Exception as e:
        print(f"ERROR during encoding: {e}")
        return

    # 2. CHECK PERSISTENCE (GET /messages)
    print("\n[2] Verifying Persistence (GET /messages)...")
    try:
        res = requests.get(f"{BASE_URL}/messages")
        msgs = res.json()
        found = next((m for m in msgs if m['id'] == msg_id), None)
        if found:
            print(f"✅ Message found in DB history!")
            print(f"   Sender: {found['sender']}, Encrypted: {found['is_encrypted']}")
        else:
            print(f"❌ Message NOT found in DB history.")
    except Exception as e:
        print(f"ERROR fetching history: {e}")

    # 3. DECODE
    print("\n[3] Decoding (Server-side)...")
    try:
        # We send the filename/url back
        payload = {'stego_image': stego_url}
        
        start_time = time.time()
        response = requests.post(f"{BASE_URL}/decode_message", json=payload)
        
        if response.status_code != 200:
            print(f"FAILED: {response.text}")
            return
            
        data = response.json()
        decoded_b64 = data.get('decoded_content')
        
        elapsed = time.time() - start_time
        print(f"✅ Decoded Image Retrieved ({elapsed:.2f}s)")
        print("(Note: Since we encrypted the text, the resulting image will display the encrypted salt:token string)")
            
    except Exception as e:
        print(f"ERROR during decoding: {e}")

if __name__ == "__main__":
    run_demo()
