# 🌍 Project EARTH | Unified Creator & Talent Ecosystem

Project EARTH is a premium social portal designed for creators, designers, developers, and recruiters. Inspired by LinkedIn, Behance, ArtStation, and Discord, it provides a centralized hub to share portfolios, discover talent, manage contracts, and chat securely.

---

## ✨ Features

### 1. 🏠 Premium Home Feed
* **Tabs**: Filter posts by *For You*, *Trending*, *Following*, *Latest*, *Hiring*, and *Collaborations*.
* **Interactions**: Like, bookmark, comment, nesting replies, and share posts.
* **Polls**: Add interactive poll questions and live options.

### 2. 👤 High-Fidelity Creator Profiles
* Cover Banners, Verified Badges, professional titles, websites, and location tags.
* Showcases: Portfolio galleries, Achievements log, and Certificates list.
* Call to Actions: Follow, message, hire, or collaborate.
* **Security**: Filters self-profile view metrics automatically to prevent fake view inflation.

### 3. 💬 Advanced Secure Messenger
* **Drag & Drop**: Drop files directly into the window to upload attachments.
* **Clipboard Paste**: Paste screenshots directly into inputs to send them instantly.
* **Reactions**: Hover over bubbles to react with 👍, ❤️, 🔥, 😂.
* **Media Playback**: Play videos and audio clips directly in chat bubbles.
* **Attachments**: Standard formats (PDF, DOCX, ZIP, MP4, PNG, JPG).
* **Find Users**: Sidebar search showing all creators on the platform.

### 4. 🧭 Pinterest-style Explore Hub
* Masonry showcase layouts filtering creative fields: Gaming, Film, Music, Fashion, AI, Startups, and Tech.
* Sliding grids displaying featured creators, trending companies, and trending projects.

### 5. 💼 Recruiter Marketplace & Gigs
* Recruiter project creator dashboard tracking budgets, required skills, timelines, and open positions.
* **AI Matchmaking**: Sidebar smart match gauge showing overlap scores (e.g., 85% match), green matching tags, and red missing tags.

---

## 🛠️ Tech Stack

* **Frontend**: React (Vite), TailwindCSS, Lucide Icons, HTML5
* **Backend**: Node.js, Express.js, JWT, Bcrypt
* **Database**: MongoDB Atlas (with a dynamic file-based `dbFallback.json` system)
* **Storage**: Cloudinary (Automatic auto-type uploader fallback)

---

## 🚀 Environment Variables

Create a `.env` file in the `backend/` folder:

```env
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
```
