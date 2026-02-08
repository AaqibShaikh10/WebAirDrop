export class WebRTCManager {
    constructor(deviceId, signalingClient, onPeerConnected, onPeerDisconnected, onDataReceived) {
        this.deviceId = deviceId;
        this.signalingClient = signalingClient;
        this.onPeerConnected = onPeerConnected;
        this.onPeerDisconnected = onPeerDisconnected;
        this.onDataReceived = onDataReceived;
        this.peers = new Map();
        this.dataChannels = new Map();
        this.rtcConfig = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:global.stun.twilio.com:3478' }
            ]
        };
    }

    async connectToPeers(peerList) {
        for (const peer of peerList) {
            this.createPeerConnection(peer.socketId, true);
        }
    }

    async handleSignal(senderId, signal) {
        let pc = this.peers.get(senderId);

        if (!pc) {
            if (signal.type === 'offer') {
                pc = await this.createPeerConnection(senderId, false);
            } else {
                console.warn("Received signal for unknown peer:", senderId);
                return;
            }
        }

        if (signal.type === 'offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(signal));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            this.signalingClient.sendSignal(senderId, answer);
        } else if (signal.type === 'answer') {
            await pc.setRemoteDescription(new RTCSessionDescription(signal));
        } else if (signal.candidate) {
            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
        }
    }

    async createPeerConnection(targetSocketId, isInitiator) {
        console.log(`Creating peer connection to ${targetSocketId}, initiator: ${isInitiator}`);
        const pc = new RTCPeerConnection(this.rtcConfig);
        this.peers.set(targetSocketId, pc);

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                this.signalingClient.sendSignal(targetSocketId, { candidate: event.candidate });
            }
        };

        pc.onconnectionstatechange = () => {
            console.log(`Connection state with ${targetSocketId}: ${pc.connectionState}`);
            if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
                this.closeConnection(targetSocketId);
            } else if (pc.connectionState === 'connected') {
                this.onPeerConnected(targetSocketId);
            }
        };

        if (isInitiator) {
            const dc = pc.createDataChannel("file-transfer");
            this.setupDataChannel(targetSocketId, dc);

            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            this.signalingClient.sendSignal(targetSocketId, offer);
        } else {
            pc.ondatachannel = (event) => {
                this.setupDataChannel(targetSocketId, event.channel);
            };
        }

        return pc;
    }

    setupDataChannel(socketId, dc) {
        dc.binaryType = 'arraybuffer';
        this.dataChannels.set(socketId, dc);
        dc.onopen = () => {
            console.log(`Data channel open with ${socketId}`);
            this.onPeerConnected(socketId);
        };
        dc.onmessage = (event) => {
            this.onDataReceived(socketId, event.data);
        };
    }

    closeConnection(socketId) {
        const pc = this.peers.get(socketId);
        if (pc) {
            pc.close();
            this.peers.delete(socketId);
        }
        const dc = this.dataChannels.get(socketId);
        if (dc) {
            dc.close();
            this.dataChannels.delete(socketId);
        }
        this.onPeerDisconnected(socketId);
    }

    sendData(socketId, data) {
        const dc = this.dataChannels.get(socketId);
        if (dc && dc.readyState === 'open') {
            dc.send(data);
        } else {
            console.error(`Data channel not open for ${socketId}`);
        }
    }
}
