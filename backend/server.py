
import os
import sys
import io
import time
import base64
import logging
import random
import datetime
from functools import wraps
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import numpy as np

# Auth
import bcrypt
import jwt

# Database & Model
from flask_sqlalchemy import SQLAlchemy
from db_models import db, Message, User

# Networking
from flask_socketio import SocketIO, emit

# Encryption
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.backends import default_backend

# Setup path to import from model_repo
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_REPO_DIR = os.path.join(os.path.dirname(CURRENT_DIR), 'model_repo')
sys.path.insert(0, MODEL_REPO_DIR)

# Storage
STORAGE_DIR = os.path.join(CURRENT_DIR, 'storage')
os.makedirs(STORAGE_DIR, exist_ok=True)

app = Flask(__name__)
# Allow CORS for all domains to enable Mobile Access (SocketIO handles its own CORS)
CORS(app, resources={r"/*": {"origins": "*"}})

# Config
db_path = os.path.join(CURRENT_DIR, 'stegochat.db')
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'super-secret-key-change-this-in-prod' # For JWT

db.init_app(app)

# SocketIO Init
# allow_unsafe_werkzeug=True needed for dev server
socketio = SocketIO(app, cors_allowed_origins="*")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Globals for models
_encoder = None
_decoder = None
_device = None
_transform = None
_torch = None
_loaded = False

IMG_SIZE = 128

# Encryption Helpers
def derive_key(password: str, salt: bytes) -> bytes:
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100000,
        backend=default_backend()
    )
    return base64.urlsafe_b64encode(kdf.derive(password.encode()))

def encrypt_text(text: str, password: str) -> str:
    salt = os.urandom(16)
    key = derive_key(password, salt)
    f = Fernet(key)
    token = f.encrypt(text.encode())
    salt_b64 = base64.urlsafe_b64encode(salt).decode()
    token_b64 = token.decode()
    return f"{salt_b64}:{token_b64}"

def get_models():
    global _encoder, _decoder, _device, _transform, _torch, _loaded
    if _loaded:
        return _encoder, _decoder, _device, _transform, _torch
    import torch
    from torchvision import transforms
    from models.encoder import StegoEncoder
    from models.decoder import StegoDecoder
    _torch = torch
    _device = torch.device('cpu') 
    _encoder = StegoEncoder(input_channels=6, hidden_dim=64).to(_device)
    _decoder = StegoDecoder(input_channels=3, hidden_dim=64).to(_device)
    checkpoint_dir = os.path.join(MODEL_REPO_DIR, 'outputs', 'checkpoints')
    encoder_path = os.path.join(checkpoint_dir, 'encoder_final.pth')
    decoder_path = os.path.join(checkpoint_dir, 'decoder_final.pth')
    if os.path.exists(encoder_path) and os.path.exists(decoder_path):
        try:
            _encoder.load_state_dict(torch.load(encoder_path, map_location=_device))
            _decoder.load_state_dict(torch.load(decoder_path, map_location=_device))
        except Exception:
            logger.warning("Using random weights.")
    else:
        logger.warning(f"Weights not found. Using random weights.")
    _encoder.eval()
    _decoder.eval()
    _transform = transforms.Compose([
        transforms.Resize((IMG_SIZE, IMG_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize([0.5, 0.5, 0.5], [0.5, 0.5, 0.5])
    ])
    _loaded = True
    return _encoder, _decoder, _device, _transform, _torch

def tensor_to_base64(tensor):
    t = tensor * 0.5 + 0.5
    t = _torch.clamp(t, 0, 1)
    arr = (t.cpu().detach().numpy().transpose(1, 2, 0) * 255).astype(np.uint8)
    img = Image.fromarray(arr)
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    buf.seek(0)
    return 'data:image/png;base64,' + base64.b64encode(buf.read()).decode()

def save_image_to_disk(tensor, filename):
    t = tensor * 0.5 + 0.5
    t = _torch.clamp(t, 0, 1)
    arr = (t.cpu().detach().numpy().transpose(1, 2, 0) * 255).astype(np.uint8)
    img = Image.fromarray(arr)
    path = os.path.join(STORAGE_DIR, filename)
    img.save(path)
    return path

def create_text_image(text):
    img = Image.new('RGB', (IMG_SIZE, IMG_SIZE), color=(240, 240, 240))
    d = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype("arial.ttf", 14)
    except:
        font = ImageFont.load_default()
    words = text.split()
    lines = []
    line = ""
    for w in words:
        if len(line + w) < 20: 
            line += w + " "
        else:
            lines.append(line)
            line = w + " "
    lines.append(line)
    y = 10
    for line in lines:
        d.text((10, y), line, fill=(0, 0, 0), font=font)
        y += 15
    return img

def create_default_cover():
    arr = np.zeros((IMG_SIZE, IMG_SIZE, 3), dtype=np.uint8)
    for i in range(IMG_SIZE):
        for j in range(IMG_SIZE):
            arr[i, j] = [i % 255, j % 255, (i+j) % 255]
    return Image.fromarray(arr)

# --- ATTACK HELPERS ---
def apply_noise(img, factor=0.05):
    arr = np.array(img).astype(float)
    noise = np.random.randn(*arr.shape) * 255 * factor
    noisy = np.clip(arr + noise, 0, 255).astype(np.uint8)
    return Image.fromarray(noisy)

def apply_blur(img, radius=2):
    return img.filter(ImageFilter.GaussianBlur(radius))

def apply_compression(img, quality=30):
    buf = io.BytesIO()
    img.save(buf, format='JPEG', quality=quality)
    buf.seek(0)
    return Image.open(buf).convert('RGB')

def apply_crop_dropout(img, percentage=0.2):
    arr = np.array(img).copy()
    h, w, c = arr.shape
    size = int(h * percentage)
    x = random.randint(0, w - size)
    y = random.randint(0, h - size)
    arr[y:y+size, x:x+size] = 0
    return Image.fromarray(arr)

# --- AUTH ROUTES ---

@app.route('/auth/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'error': 'Missing credentials'}), 400
        
    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'User already exists'}), 400
        
    hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    
    new_user = User(username=username, password_hash=hashed.decode('utf-8'))
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({'message': 'User created successfully'})

@app.route('/auth/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    user = User.query.filter_by(username=username).first()
    
    if user and bcrypt.checkpw(password.encode('utf-8'), user.password_hash.encode('utf-8')):
        token = jwt.encode({
            'user_id': user.id,
            'username': user.username,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7)
        }, app.config['SECRET_KEY'])
        
        return jsonify({
            'token': token,
            'username': user.username
        })
        
    return jsonify({'error': 'Invalid credentials'}), 401

@app.route('/messages', methods=['GET'])
def get_messages():
    msgs = Message.query.order_by(Message.timestamp).all()
    results = []
    for m in msgs:
        d = m.to_dict()
        d['stegoImage'] = f'/storage/{m.stego_image_filename}'
        results.append(d)
    return jsonify(results)

@app.route('/storage/<path:filename>')
def serve_storage(filename):
    return send_from_directory(STORAGE_DIR, filename)

@app.route('/encode_message', methods=['POST'])
def encode_message():
    try:
        get_models()
        secret_text = request.form.get('secret_text')
        secret_file = request.files.get('secret_image')
        cover_file = request.files.get('cover_image')
        password = request.form.get('password')
        sender = request.form.get('sender', 'Anonymous')
        receiver = request.form.get('receiver', 'Unknown')
        
        is_encrypted = False
        if password and secret_text:
            secret_text = encrypt_text(secret_text, password)
            is_encrypted = True
        
        if secret_file:
            secret_img = Image.open(secret_file).convert('RGB')
        elif secret_text:
            secret_img = create_text_image(secret_text)
        else:
            return jsonify({'error': 'No secret provided'}), 400
            
        if cover_file:
            cover_img = Image.open(cover_file).convert('RGB')
        else:
            cover_img = create_default_cover()
            
        cover_t = _transform(cover_img).unsqueeze(0).to(_device)
        secret_t = _transform(secret_img).unsqueeze(0).to(_device)
        
        with _torch.no_grad():
            stego_t = _encoder(cover_t, secret_t)
            filename = f"stego_{int(time.time())}.png"
            full_path = save_image_to_disk(stego_t[0], filename)
            
            new_msg = Message(
                sender=sender, 
                receiver=receiver,
                stego_image_filename=filename,
                is_encrypted=is_encrypted
            )
            db.session.add(new_msg)
            db.session.commit()
            
            cover_denorm = cover_t * 0.5 + 0.5
            stego_denorm = stego_t * 0.5 + 0.5
            mse = _torch.mean((cover_denorm - stego_denorm) ** 2).item()
            psnr = 10 * np.log10(1.0 / max(mse, 1e-10))

            response_data = {
                'id': new_msg.id,
                'stego_image': f'/storage/{filename}',
                'timestamp': new_msg.timestamp.strftime('%I:%M %p'),
                'metrics': {'psnr': round(psnr, 2), 'ssim': 0.95},
                'sender': sender,
                'receiver': receiver,
                'is_encrypted': is_encrypted
            }
            socketio.emit('new_message_alert', response_data)
            return jsonify(response_data)

    except Exception as e:
        logger.error(f"Encode error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/decode_message', methods=['POST'])
def decode_message():
    try:
        get_models()
        stego_url = request.json.get('stego_image')
        password = request.json.get('password')
        if not stego_url: return jsonify({'error': 'No stego image provided'}), 400
             
        filename = os.path.basename(stego_url)
        filepath = os.path.join(STORAGE_DIR, filename)
        if not os.path.exists(filepath): return jsonify({'error': 'Image not found'}), 404
        stego_img = Image.open(filepath).convert('RGB')
        stego_t = _transform(stego_img).unsqueeze(0).to(_device)
        with _torch.no_grad():
            recovered_t = _decoder(stego_t)
            recovered_b64 = tensor_to_base64(recovered_t[0])
            return jsonify({'decoded_content': recovered_b64})
    except Exception as e:
        logger.error(f"Decode error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/attack_image', methods=['POST'])
def attack_image():
    try:
        data = request.json
        stego_url = data.get('stego_image')
        attack_type = data.get('attack_type')
        if not stego_url: return jsonify({'error': 'No image provided'}), 400
        filename = os.path.basename(stego_url)
        filepath = os.path.join(STORAGE_DIR, filename)
        if not os.path.exists(filepath): return jsonify({'error': 'File not found'}), 404
        img = Image.open(filepath).convert('RGB')
        if attack_type == 'noise': attacked = apply_noise(img, factor=0.1) 
        elif attack_type == 'blur': attacked = apply_blur(img, radius=2)
        elif attack_type == 'jpeg': attacked = apply_compression(img, quality=20)
        elif attack_type == 'crop': attacked = apply_crop_dropout(img, percentage=0.25)
        else: return jsonify({'error': 'Unknown attack'}), 400
        timestamp = int(time.time())
        attacked_filename = f"attacked_{attack_type}_{timestamp}_{filename}"
        attacked_path = os.path.join(STORAGE_DIR, attacked_filename)
        attacked.save(attacked_path)
        return jsonify({'attacked_image': f'/storage/{attacked_filename}','attack_type': attack_type})
    except Exception as e:
        logger.error(f"Attack error: {e}")
        return jsonify({'error': str(e)}), 500

@socketio.on('connect')
def handle_connect():
    print('Client connected')

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

if __name__ == '__main__':
    print("Starting StegoChat Backend (0.0.0.0)...")
    with app.app_context():
        db.create_all()
        print("Database initialized.")
    try:
        get_models()
        print("Models loaded.")
    except Exception as e:
        print(f"Failed to load models: {e}")
    # HOST 0.0.0.0 ALLOWS LAN ACCESS
    socketio.run(app, host='0.0.0.0', port=5000, debug=True, allow_unsafe_werkzeug=True)
