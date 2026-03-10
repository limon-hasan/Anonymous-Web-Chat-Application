<div align="center">
  <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/ghost.svg" width="100" alt="ChatChat Logo" />
  <h1>ChatChat</h1>
  <p><h3>Chat with Strangers. Vanish Like a Jinn.</h3></p>
  <p>A fast, sleek, and 100% anonymous real-time chat application built with Next.js, Socket.io, and Tailwind CSS.</p>

  <p>
    <img alt="Version" src="https://img.shields.io/badge/version-1.0.0-blue.svg?cacheSeconds=2592000" />
  </p>
</div>

---

## 🚀 Features

* **🎭 100% Anonymous 1v1 Chatting**: Instantly match with strangers around the globe.
* **👥 Custom Group Rooms**: Generate private room links to chat with multiple people simultaneously.
* **🔒 User Accounts**: Optional registration system with strict validation, canvas-based CAPTCHA, and secure JWT authentication.
* **⚡ Real-Time Engine**: Built on Socket.io for instantaneous message delivery and typing indicators.
* **📱 Progressive Web App (PWA)**: Fully installable on desktops and mobile devices native OS dialogs.
* **🌗 Dynamic Theming**: Toggle between beautiful, glowing 'Neon Pink' and 'Cyber Cyan' color profiles.
* **📜 Local Chat History**: Your encrypted chat sessions are automatically summarized and stored securely on your local device for you to review later.
* **📊 Live Global Statistics**: Real-time counters showing total active users, completed chats, and messages sent across the platform.

## 🛠️ Technology Stack

**Frontend:**
* [Next.js](https://nextjs.org/) (React Framework)
* [Tailwind CSS](https://tailwindcss.com/) (Styling & Neon Animations)
* [Lucide Icons](https://lucide.dev/) (SVG Iconography)
* [Socket.io-client](https://socket.io/) (Real-time connection)

**Backend:**
* [Node.js](https://nodejs.org/) & [Express](https://expressjs.com/) (Server)
* [Socket.io](https://socket.io/) (WebSocket Engine)
* [SQLite](https://www.sqlite.org/) (In-memory/Local Database)
* [Bcrypt.js](https://www.npmjs.com/package/bcryptjs) & [JSON Web Tokens](https://jwt.io/) (Authentication & Hashing)

## ⚙️ Getting Started

Follow these steps to set up the project locally on your machine.

### Prerequisites

Ensure you have the following installed on your system:
* [Node.js](https://nodejs.org/en/download/) (v16.0.0 or higher)
* `npm` or `yarn` package manager

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/limon-hasan/Anonymous-Web-Chat-Application.git
   cd Anonymous-Web-Chat-Application
   ```

2. **Setup the Backend:**
   Open a new terminal window and navigate to the backend folder.
   ```bash
   cd backend
   npm install
   node server.js
   ```
   *The backend will boot up and listen on port `4000`.*

3. **Setup the Frontend:**
   Open a second terminal window and navigate to the frontend folder.
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   *The Next.js frontend will boot up on `http://localhost:3000`.*

4. **Start Chatting!**
   Open your browser, navigate to `http://localhost:3000`, and start matching!

## 🛡️ Security & Privacy

* **Strict Anonymity**: No personal data is required to use the immediate 1v1 matchmaking service.
* **Data Transience**: Chat messages are only kept in memory and passed between sockets; they are deliberately wiped on disconnection.
* **Encrypted Passwords**: Any passwords created during optional registration are salted and hashed utilizing `bcryptjs` before entering the local SQLite databases.


---

<div align="center">
  <p>Built as a sleek, ephemeral communication platform.</p>
</div>
