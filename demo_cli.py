
import requests
import base64
import os
import sys
import time

# Configuration
BASE_URL = "http://localhost:5000"
COVER_PATH = r"C:\Users\tarun\OneDrive\Desktop\Cover.png"
SECRET_PATH = r"C:\Users\tarun\OneDrive\Desktop\Captures\fox.jpg"
OUTPUT_PATH = r"C:\Users\tarun\OneDrive\Desktop\StegoChat_Decoded_Fox.png"

def run_demo():
    print(f"=== StegoChat Automated Demo ===")
    print(f"Target Backend: {BASE_URL}")
    print(f"Cover Image: {COVER_PATH}")
    print(f"Secret Image: {SECRET_PATH}")
    
    # Check files
    if not os.path.exists(COVER_PATH):
        print(f"ERROR: Cover file not found at {COVER_PATH}")
        return
    if not os.path.exists(SECRET_PATH):
        print(f"ERROR: Secret file not found at {SECRET_PATH}")
        return

    # 1. ENCODE
    print("\n[1] Sending images for encoding...")
    start_time = time.time()
    try:
        files = {
            'cover_image': ('cover.png', open(COVER_PATH, 'rb'), 'image/png'),
            'secret_image': ('secret.jpg', open(SECRET_PATH, 'rb'), 'image/jpeg')
        }
        
        response = requests.post(f"{BASE_URL}/encode_message", files=files)
        
        if response.status_code != 200:
            print(f"FAILED: {response.text}")
            return
            
        data = response.json()
        stego_b64 = data.get('stego_image')
        metrics = data.get('metrics', {})
        
        elapsed = time.time() - start_time
        print(f"✅ Encoding Successful ({elapsed:.2f}s)")
        print(f"   Stego Image generated (Size: {len(stego_b64)} chars)")
        print(f"   Metrics: PSNR={metrics.get('psnr')} dB, SSIM={metrics.get('ssim')}")
        
    except Exception as e:
        print(f"ERROR during encoding: {e}")
        return

    # 2. DECODE
    print("\n[2] Sending stego result for decoding...")
    try:
        # We send the base64 string back as JSON
        payload = {'stego_image': stego_b64}
        
        start_time = time.time()
        response = requests.post(f"{BASE_URL}/decode_message", json=payload)
        
        if response.status_code != 200:
            print(f"FAILED: {response.text}")
            return
            
        data = response.json()
        decoded_b64 = data.get('decoded_content')
        
        elapsed = time.time() - start_time
        print(f"✅ Decoding Successful ({elapsed:.2f}s)")
        
        # Save result
        if decoded_b64:
            # Remove header if present
            if ',' in decoded_b64:
                header, encoded = decoded_b64.split(',', 1)
                img_data = base64.b64decode(encoded)
            else:
                img_data = base64.b64decode(decoded_b64)
                
            with open(OUTPUT_PATH, 'wb') as f:
                f.write(img_data)
            print(f"\n🎉 Decoded image saved to: {OUTPUT_PATH}")
            print("You can open this file to verify the recovered secret!")
            
    except Exception as e:
        print(f"ERROR during decoding: {e}")

if __name__ == "__main__":
    run_demo()
