# WebAirDrop

WebAirDrop is a high-speed, peer-to-peer file transfer tool that works entirely in your browser. It allows you to send files of any size directly to other devices on your local network (or across the internet) without uploading them to a third-party server.

Think of it as AirDrop, but for the web—working across Windows, macOS, Android, and iOS.

## Features

- **Peer-to-Peer Transfer**: Files go directly from device to device using WebRTC.
- **Privacy First**: No files are ever stored on a server.
- **Unlimited File Size**: Send large files without restrictions.
- **Cross-Platform**: Works on any device with a modern web browser.
- **Smart Queue System**: Handles multiple file transfers smoothly.
- **Cool Device Names**: Automatically assigns unique identities (e.g., *Cosmic Tiger*, *Neon Dragon*) to devices.
- **Dark Mode**: Sleek, professional dark theme by default.

## Tech Stack

- **Frontend**: Vanilla JS + Vite
- **Networking**: WebRTC (RTCPeerConnection, RTCDataChannel)
- **Signaling**: Socket.io (Node.js)
- **Styling**: CSS3 (Glassmorphism & Modern UI)

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/AaqibShaikh10/WebAirDrop.git
    cd WebAirDrop
    ```

2.  **Install dependencies for both Client and Server:**
    ```bash
    # Install server dependencies
    cd server
    npm install

    # Install client dependencies
    cd ../client
    npm install
    ```

### Running Locally

1.  **Start the Signaling Server:**
    ```bash
    cd server
    npm start
    # Specific port: 3000
    ```

2.  **Start the Client (in a new terminal):**
    ```bash
    cd client
    npm run dev
    ```

3.  Open `http://localhost:5173` in two different browser tabs (or devices) to test connection!

## Contributing

Contributions are welcome! Feel free to push specific feature requests or bug fixes.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.

---
*Built with love by [Aaqib Shaikh](https://github.com/AaqibShaikh10)*
