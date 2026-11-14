# <p align="center">⚡ OmniDrive - Official Public Web & App Gateway</p>

<p align="center">
  <b>Unify multiple Google Drive accounts into one consolidated, infinite cloud storage pool.</b>
</p>

<p align="center">
  <a href="https://github.com/Omni-009/Omni-Drive-Public/releases/tag/v1.0.0"><img src="https://img.shields.io/badge/Release-v1.0.0-emerald?style=for-the-badge&logo=android&logoColor=white" alt="Release v1.0.0" /></a>
  <a href="https://9drive-frontend.baniarohan009.workers.dev"><img src="https://img.shields.io/badge/Live_Website-Cloudflare-F38020?style=for-the-badge&logo=cloudflare&logoColor=white" alt="Live Website" /></a>
  <a href="https://github.com/Omni-009/Omni-Drive-Public/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="License" /></a>
  <img src="https://img.shields.io/badge/Database-TiDB_Serverless-00A67E?style=for-the-badge&logo=mysql&logoColor=white" alt="TiDB Serverless" />
</p>

---

## 🌐 Quick Links & Downloads

| Platform | Access / Action | Link |
| :--- | :--- | :--- |
| 🚀 **Live Web Platform** | Official Website & Cloud Gateway | **[Launch OmniDrive Web](https://9drive-frontend.baniarohan009.workers.dev)** |
| 📱 **Android App (APK)** | Direct GitHub Release (v1.0.0) | **[Download OmniDrive.apk (v1.0.0)](https://github.com/Omni-009/Omni-Drive-Public/releases/download/v1.0.0/OmniDrive.apk)** |
| 📦 **GitHub Releases** | All Versions, Changelogs & Assets | **[View Releases](https://github.com/Omni-009/Omni-Drive-Public/releases)** |
| ☁️ **TiDB Cloud** | Distributed MySQL Database | Active & Operational (99.99% Uptime) |

---

## 🌟 What is OmniDrive?

**OmniDrive** solves the fragmented cloud storage problem. Instead of juggling 3, 5, or 10 separate Google Drive accounts, OmniDrive unifies all their free 15 GB quotas into one single, seamless storage pool.

### 💡 The Core Problem & The OmniDrive Solution:
* **The Problem:** Free Google accounts offer 15 GB each. When one gets full, managing files across separate logins is chaotic and frustrating.
* **The Solution:** Connect all your accounts once via secure OAuth 2.0. OmniDrive presents a single virtual drive (e.g. 5 accounts = **75 GB Pooled Free Storage**). Uploads automatically route to whichever account has the most available space.

---

## ✨ Key Capabilities & Architecture

```
[ Web / Mobile App ]
         │ (HTTP Multipart Stream)
         ▼
[ Go / Gin High-Speed Gateway (Render) ]
         ├──► Stream directly to Google Drive [Folder: OmniDrive] (Zero Local Disk Footprint)
         └──► Permanent Records & Auth State [TiDB Cloud Serverless (MySQL)]
```

### 1. 🔀 Multi-Account Storage Pooling
* Connect unlimited Google accounts via official Google OAuth 2.0.
* Real-time combined quota visualization and analytics.
* Smart auto-load balancing: files automatically stream to the drive with highest remaining capacity.

### 2. ⚡ Zero-Disk Streaming Engine
* **Direct-to-Drive Pipeline:** Uploaded chunks are piped directly into Google Drive in-memory using Google Resumable Upload sessions.
* **Zero Disk Consumption:** Large 4K videos, ISOs, and zip archives stream without writing a single byte to the local server disk.

### 3. 🎨 Virtual RGB Folders & Custom Icons
* Organize files in deep nested virtual folders.
* Tag folders with 16+ vibrant RGB color bars and 40+ category icons.
* Folders live permanently in the database, while physical files reside safely in your dedicated Google Drive `OmniDrive` folder.

### 4. 🎬 In-Browser High-Definition Media Streaming
* Built-in **Plyr** HD video player with custom playback speeds (0.5x to 2x), subtitles, and range request seeking.
* Integrated audio player, high-res image lightbox, PDF reader, and syntax-highlighted code editor.

### 5. 📱 Native Android Experience (APK v1.0.0)
* Built with Trusted Web Activity (TWA) architecture.
* 120Hz fluid hardware acceleration and native Dark Mode support.
* Persistent biometric/session auth and direct download integration.

### 6. 🔒 Enterprise Security & Privacy
* **AES-256 Token Encryption:** Google OAuth tokens are encrypted at rest before database storage.
* **Permanent Cloud DB:** Backed by TiDB Cloud Serverless (MySQL) so files, folders, and logins never disappear on server reboots.
* **Scoped Permissions:** Only accesses the dedicated `OmniDrive` folder created in your personal Drive.

---

## 📲 Installing the Android App

1. Download the latest release: **[OmniDrive.apk (v1.0.0)](https://github.com/Omni-009/Omni-Drive-Public/releases/download/v1.0.0/OmniDrive.apk)**
2. Tap on the downloaded `.apk` file and select **Install** *(Enable 'Install unknown apps' if prompted by your browser)*.
3. Launch OmniDrive, sign in, and enjoy your unified cloud storage!

> **System Requirement:** Android 8.0 (Oreo) or higher • File size: ~4.46 MB.

---

## 🛠️ Tech Stack

| Component | Technology |
| :--- | :--- |
| **Frontend Framework** | React 19 + Vite 8 + TypeScript |
| **Styling** | Tailwind CSS 4 + Modern Glassmorphism |
| **Icons** | Lucide React |
| **Android Client** | Android SDK 36 (TWA / Trusted Web Activity) |
| **Edge Deployment** | Cloudflare Workers & Global CDN |
| **Backend Engine** | Golang / Gin High-Speed Engine (Render) |
| **Database** | TiDB Cloud Serverless (Distributed MySQL) |

---

## 💻 Running the Web App Locally

```bash
# 1. Clone this repository
git clone https://github.com/Omni-009/Omni-Drive-Public.git
cd Omni-Drive-Public

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev

# 4. Build production bundle
npm run build
```

---

## 📄 License & Attribution

Distributed under the **MIT License**. All files uploaded via OmniDrive are streamed and securely preserved inside the user's dedicated personal Google Drive vault folder.
