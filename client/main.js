import './style.css'
import { v4 as uuidv4 } from 'uuid';
import { SignalingClient } from './signaling';
import { WebRTCManager } from './webrtc';
import { FileTransferManager } from './file-transfer';
import { NameGenerator } from './name-generator';

console.log('WebAirDrop client starting...');

const app = document.querySelector('#app');
const statusDiv = document.querySelector('#status');
const peersContainer = document.querySelector('#peers-container');
const transfersContainer = document.querySelector('#transfers-container');
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const browseBtn = document.getElementById('browse-btn');

let deviceId = localStorage.getItem('deviceId');
let displayName = localStorage.getItem('displayName');

if (!deviceId) {
    deviceId = uuidv4();
    localStorage.setItem('deviceId', deviceId);
}

if (!displayName) {
    const generator = new NameGenerator();
    displayName = generator.generate();
    localStorage.setItem('displayName', displayName);
}

console.log('Device:', deviceId, displayName);
statusDiv.textContent = `${displayName}`;
statusDiv.style.color = 'var(--secondary-color)';

const SIGNALING_SERVER_URL = `http://${window.location.hostname}:3000`;

const onSignal = (data) => {
    webRTCManager.handleSignal(data.sender, data.signal);
};

const onPeerJoined = (data) => {
    console.log(`Peer joined: ${data.displayName} (${data.socketId})`);
};

const onPeerLeft = (data) => {
    console.log(`Peer left: ${data.socketId}`);
    webRTCManager.closeConnection(data.socketId);
    removePeerUI(data.socketId);
};

const onExistingPeers = (peers) => {
    console.log('Received existing peers:', peers);
    webRTCManager.connectToPeers(peers);
};

const onPeerConnected = (socketId) => {
    console.log(`Connected to peer: ${socketId}`);
    const peer = signalingClient.peers.get(socketId) || { displayName: 'Unknown Peer' };
    addPeerUI(socketId, peer.displayName);
};

const onPeerDisconnected = (socketId) => {
    console.log(`Disconnected from peer: ${socketId}`);
    removePeerUI(socketId);
};

const onDataReceived = (socketId, data) => {
    fileTransferManager.handleData(socketId, data);
};

const onTransferProgress = (socketId, fileId, current, total, isSending) => {
    updateTransferUI(fileId, current, total, isSending, socketId);
};

const onFileReceived = (name, blob) => {
    console.log(`File received: ${name}`);
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.textContent = `Download ${name}`;
    link.className = 'download-link';

    const container = document.createElement('div');
    container.className = 'file-received';
    container.appendChild(document.createTextNode(`Received ${name} `));
    container.appendChild(link);

    transfersContainer.appendChild(container);
};

const signalingClient = new SignalingClient(
    SIGNALING_SERVER_URL,
    deviceId,
    displayName,
    onSignal,
    onPeerJoined,
    onPeerLeft,
    onExistingPeers
);

signalingClient.peers = new Map();
const originalOnPeerJoined = signalingClient.onPeerJoined;
signalingClient.onPeerJoined = (data) => {
    signalingClient.peers.set(data.socketId, { displayName: data.displayName });
    originalOnPeerJoined(data);
};
const originalOnExistingPeers = signalingClient.onExistingPeers;
signalingClient.onExistingPeers = (peers) => {
    peers.forEach(p => signalingClient.peers.set(p.socketId, { displayName: p.displayName }));
    originalOnExistingPeers(peers);
};


const webRTCManager = new WebRTCManager(
    deviceId,
    signalingClient,
    onPeerConnected,
    onPeerDisconnected,
    onDataReceived
);

const fileTransferManager = new FileTransferManager(
    webRTCManager,
    onTransferProgress,
    onFileReceived
);

signalingClient.connect();

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
});

browseBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', () => handleFiles(fileInput.files));

function handleFiles(files) {
    if (files.length === 0) return;

    const connectedPeers = Array.from(webRTCManager.peers.keys());
    if (connectedPeers.length === 0) {
        alert("No peers connected! Open this app in another tab or device.");
        return;
    }

    for (const peerId of connectedPeers) {
        fileTransferManager.sendFiles(peerId, files);
    }
}

function addPeerUI(socketId, name) {
    if (document.getElementById(`peer-${socketId}`)) return;

    if (!name) {
        const p = signalingClient.peers.get(socketId);
        name = p ? p.displayName : `Device ${socketId.substring(0, 5)}`;
    }

    const placeholder = document.querySelector('.peer-placeholder');
    if (placeholder) placeholder.remove();

    const el = document.createElement('div');
    el.id = `peer-${socketId}`;
    el.className = 'peer-item';

    const statusDot = document.createElement('span');
    statusDot.style.height = '10px';
    statusDot.style.width = '10px';
    statusDot.style.backgroundColor = '#03dac6';
    statusDot.style.borderRadius = '50%';
    statusDot.style.display = 'inline-block';

    el.appendChild(statusDot);
    el.appendChild(document.createTextNode(name));

    peersContainer.appendChild(el);
}

function removePeerUI(socketId) {
    const el = document.getElementById(`peer-${socketId}`);
    if (el) el.remove();

    if (peersContainer.children.length === 0) {
        const placeholder = document.createElement('div');
        placeholder.className = 'peer-placeholder';
        placeholder.style.color = 'rgba(255,255,255,0.3)';
        placeholder.style.fontStyle = 'italic';
        placeholder.innerText = 'Scanning for devices...';
        peersContainer.appendChild(placeholder);
    }
}

function updateTransferUI(fileId, current, total, isSending, socketId) {
    let el = document.getElementById(`transfer-${fileId}`);

    const p = signalingClient.peers.get(socketId);
    const peerName = p ? p.displayName : socketId.substring(0, 5);

    if (!el) {
        el = document.createElement('div');
        el.id = `transfer-${fileId}`;
        el.className = 'transfer-item';

        const info = document.createElement('div');
        info.className = 'transfer-info';
        el.appendChild(info);

        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        const progressFill = document.createElement('div');
        progressFill.className = 'progress-fill';
        progressBar.appendChild(progressFill);
        el.appendChild(progressBar);

        transfersContainer.appendChild(el);
    }

    const percentage = Math.round((current / total) * 100);
    const infoText = `${isSending ? 'Sending to' : 'Receiving from'} ${peerName}... ${percentage}%`;
    el.querySelector('.transfer-info').innerText = infoText;
    el.querySelector('.progress-fill').style.width = `${percentage}%`;

    if (current >= total) {
        setTimeout(() => el.remove(), 5000);
    }
}
