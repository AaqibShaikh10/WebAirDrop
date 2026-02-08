import { io } from "socket.io-client";

export class SignalingClient {
    constructor(url, deviceId, displayName, onSignal, onPeerJoined, onPeerLeft, onExistingPeers) {
        this.url = url;
        this.deviceId = deviceId;
        this.displayName = displayName;
        this.socket = null;
        this.onSignal = onSignal;
        this.onPeerJoined = onPeerJoined;
        this.onPeerLeft = onPeerLeft;
        this.onExistingPeers = onExistingPeers;
    }

    connect() {
        this.socket = io(this.url);

        this.socket.on("connect", () => {
            console.log("Connected to signaling server:", this.socket.id);
            this.socket.emit("join", { deviceId: this.deviceId, displayName: this.displayName });
        });

        this.socket.on("signal", (data) => {
            console.log("Received signal:", data);
            this.onSignal(data);
        });

        this.socket.on("player-joined", (data) => {
            console.log("Peer joined:", data);
            this.onPeerJoined(data);
        });

        this.socket.on("peer-left", (data) => {
            console.log("Peer left:", data);
            this.onPeerLeft(data);
        });

        this.socket.on("existing-peers", (data) => {
            console.log("Existing peers:", data);
            this.onExistingPeers(data);
        });
    }

    sendSignal(targetSocketId, signal) {
        this.socket.emit("signal", { target: targetSocketId, signal });
    }
}
