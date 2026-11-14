# OmniDrive - Public Web App & Landing Page 🌐📱

**OmniDrive** is an intelligent Google Cloud Storage Gateway that unifies multiple personal and workspace Google Drive accounts into one consolidated, infinite cloud storage pool.

🚀 **Live Website:** [https://9drive-frontend.baniarohan009.workers.dev](https://9drive-frontend.baniarohan009.workers.dev)  
📥 **Download Android App:** [OmniDrive.apk](https://9drive-frontend.baniarohan009.workers.dev/OmniDrive.apk)  
⚡ **API Server:** Hosted with Golang High-Speed Gin Engine on Render + TiDB Cloud Serverless

---

## 🌟 Key Highlights

- **Multi-Account Storage Pooling:** Connect 2, 5, or 10+ Google Drive accounts (15 GB + 15 GB + 15 GB...) into one unified virtual drive.
- **Zero-Disk Streaming:** Direct-to-Drive pipeline. Files stream in-memory straight into Google Drive folder `OmniDrive` with zero local server disk consumption.
- **Interactive Landing Page:** Live interactive storage savings calculator, feature matrix showcase, and mobile QR code download card.
- **Visual RGB Virtual Folders:** Organize files with 16+ color bars, 40+ custom icons, and deep nested hierarchy.
- **In-Browser HD Player:** High-performance video streaming with Plyr, custom playback speeds, subtitles, audio player, image zoom, and code syntax highlighting.
- **Public Links & Invitations:** Share files with password-protected or expiring preview links, or invite collaborators with granular permissions.
- **Native Android APK:** Built on Trusted Web Activity (TWA) with hardware-accelerated 120Hz smooth UI, dark mode, and background sync.
- **Permanent Cloud DB:** Backed by TiDB Cloud Serverless (MySQL) ensuring 99.99% uptime and zero data loss on server restarts.

---

## 🛠️ Tech Stack

- **Framework:** [React 19](https://react.dev/) + [Vite 8](https://vitejs.dev/)
- **Routing:** [React Router 7](https://reactrouter.com/)
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com/)
- **Icons:** [lucide-react](https://lucide.dev/)
- **Deployment:** [Cloudflare Workers](https://workers.cloudflare.com/) Static Assets
- **Video Player:** [Plyr](https://plyr.io/)

---

## 🚀 Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Omni-009/Omni-Drive-Public.git
   cd Omni-Drive-Public
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the local development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

5. **Deploy to Cloudflare Workers:**
   ```bash
   npx wrangler deploy
   ```

---

## 📄 License

MIT License. Designed with ❤️ for OmniDrive users.
