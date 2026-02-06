# 🧠 StegoChat Training & Research Guide

This guide explains how to use the **Research Pipeline** to train more powerful models for your StegoChat application.

## 📂 Research Notebook
We have created a ready-to-use Google Colab Notebook:  
`research/Train_StegoChat_Model.ipynb`

## 🚀 How to Train (for Free)
1.  **Open Google Colab**: [colab.research.google.com](https://colab.research.google.com)
2.  **Upload Notebook**:
    -   Click **File** > **Upload Notebook**.
    -   Select the `Train_StegoChat_Model.ipynb` file from this folder.
3.  **Enable GPU**:
    -   In Colab, go to **Runtime** > **Change runtime type**.
    -   Select **T4 GPU**.
4.  **Run All Cells**:
    -   The notebook will automatically download the **COCO Dataset** (or a sample).
    -   It will define the **High-Res (128px-256px)** architecture.
    -   It will train for 5 Epochs (adjustable).
5.  **Download Weights**:
    -   At the end, it will download `encoder_final.pth` and `decoder_final.pth`.

## 📦 Integrating with StegoChat
Once you have your new `.pth` files:

1.  Stop your local StegoChat app.
2.  Navigate to `StegoChat/model_repo/outputs/checkpoints/`.
3.  **Backup** your old files (e.g., rename them to `encoder_old.pth`).
4.  **Paste** your new files here.
5.  Restart StegoChat.

## 🧪 Experiments to Try
-   **Increase Resolution**: Change `IMG_SIZE = 256` in the notebook for HD chat.
-   **Increase Robustness**: Add noise layers (JPEG simulation) in the `StegoEncoder` class to survive compression.
