# StegoChat 🕵️‍♂️💬

**StegoChat** is a simulated secure messaging application that demonstrates the power of **Generative AI-based Steganography**. Unlike traditional encryption that scrambles data (making it obvious something is hidden), StegoChat hides secret messages *inside* ordinary-looking images. To an outside observer, users are simply sharing photos.

![StegoChat Demo](https://via.placeholder.com/800x400?text=StegoChat+Demo+Preview)

---

## 🚀 Features

-   **Deep Learning Steganography**: Uses a GAN-based Encoder-Decoder architecture to embed secrets imperceptibly.
-   **Modern "Spy" Interface**: Clean, dark-themed UI inspired by modern chat apps.
-   **User Simulation**: Switch perspectives between "Alice" and "Bob" to visualize the full sending/receiving flow.
-   **Quality Metrics**: Real-time display of **PSNR** (Peak Signal-to-Noise Ratio) and **SSIM** (Structural Similarity Index) to verify image quality.
-   **Zero-Knowledge Transport**: The backend only sees images; the "secret" is fused into the pixels before storage.

---

## 🧠 Deep Learning vs. Traditional Steganography

**How is this different?**

| Feature | Traditional (LSB/DCT) | StegoChat (Deep Learning) |
| :--- | :--- | :--- |
| **Method** | Hides bits in the Least Significant Bits of pixels. | Uses a Neural Network to "paint" the secret into the image textures. |
| **Detectability** | Easily detected by statistical analysis (Chi-square attacks). | Much harder to detect; mimics natural image distribution. |
| **Capacity** | Low capacity; high payload breaks the image. | High capacity; learns to compress and hide data efficiently. |
| **Robustness** | Very fragile (cropping/compression destroys message). | Can be trained to survive JPEG compression and noise. |

---

## 🛠️ How to Run Locally

### Prerequisites
-   Python 3.8+
-   Node.js & npm

### One-Click Start (Windows)
Simply double-click the `run_stegochat.bat` file in the root directory.

### Manual-Start
**1. Start the Backend:**
```bash
pip install -r backend/requirements.txt
python backend/server.py
```
*Server will start on http://localhost:5000*

**2. Start the Frontend:**
```bash
cd frontend
npm install
npm run dev
```
*App will open at http://localhost:5173*

---

## 🔬 Advanced: Train Your Own Model

StegoChat comes with pre-trained weights, but you can train your own model to improve quality or change the embedding strategy.

We recommend using our dedicated **Research & Evaluation Repository** for training:
👉 **[Quantitative Evaluation of Steganography](https://github.com/TARUN-2305/Quantitative-Evaluation-of-Steganography-using-PSNR-SSIM-parameters)**

### Workflow for Custom Models:
1.  **Clone the Research Repo** linked above.
2.  **Run the Training Notebook**: Follow the instructions there to train the Encoder/Decoder on a dataset like COCO or Flickr.
3.  **Evaluate**: The research repo helps you calculate average PSNR/SSIM over thousands of images to ensure model stability.
4.  **Deploy to StegoChat**:
    Once satisfied, copy your trained `.pth` files:
    *   `encoder_final.pth`
    *   `decoder_final.pth`
    
    Paste them into this project's directory:
    `StegoChat/model_repo/outputs/checkpoints/`

    *Restart the backend to load your new neural brain!* 🧠

---

## 📂 Project Structure

```
StegoChat/
├── backend/             # Flask API for Model Inference
├── frontend/            # React + Vite Chat Interface
├── model_repo/          # The Core AI Logic (Cloned)
│   ├── models/          # PyTorch definitions (Encoder/Decoder)
│   └── outputs/         # Trained Checkpoints (.pth)
└── run_stegochat.bat    # Launcher Script
```

## 📜 License
MIT
