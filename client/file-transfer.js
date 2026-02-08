export class FileTransferManager {
    constructor(webRTCManager, onProgress, onFileReceived) {
        this.webRTCManager = webRTCManager;
        this.onProgress = onProgress;
        this.onFileReceived = onFileReceived;
        this.chunkSize = 16384;
        this.receivedBuffers = new Map();

        this.transferQueue = [];
        this.isTransferring = false;
    }

    sendFiles(socketId, files) {
        Array.from(files).forEach(file => {
            this.transferQueue.push({ socketId, file });
        });
        this._processQueue();
    }

    async _processQueue() {
        if (this.isTransferring || this.transferQueue.length === 0) return;

        this.isTransferring = true;
        const { socketId, file } = this.transferQueue.shift();

        try {
            await this.sendFile(socketId, file);
        } catch (error) {
            console.error("File transfer error:", error);
        } finally {
            this.isTransferring = false;
            setTimeout(() => this._processQueue(), 100);
        }
    }

    sendFile(socketId, file) {
        return new Promise((resolve, reject) => {
            const fileId = crypto.randomUUID();
            const metadata = {
                type: 'file-start',
                fileId: fileId,
                name: file.name,
                size: file.size,
                fileType: file.type
            };

            this.webRTCManager.sendData(socketId, JSON.stringify(metadata));

            let offset = 0;
            const reader = new FileReader();

            reader.onerror = () => reject(reader.error);

            reader.onload = (e) => {
                if (e.target.result) {
                    try {
                        this.webRTCManager.sendData(socketId, e.target.result);
                        offset += e.target.result.byteLength;
                        this.onProgress(socketId, fileId, offset, file.size, true);

                        if (offset < file.size) {
                            setTimeout(readNextChunk, 0);
                        } else {
                            this.webRTCManager.sendData(socketId, JSON.stringify({ type: 'file-end', fileId }));
                            resolve();
                        }
                    } catch (err) {
                        reject(err);
                    }
                }
            };

            const readNextChunk = () => {
                const slice = file.slice(offset, offset + this.chunkSize);
                reader.readAsArrayBuffer(slice);
            };

            readNextChunk();
        });
    }

    handleData(socketId, data) {
        if (typeof data === 'string') {
            try {
                const msg = JSON.parse(data);
                if (msg.type === 'file-start') {
                    this.receivedBuffers.set(socketId, {
                        metadata: msg,
                        chunks: [],
                        receivedBytes: 0
                    });
                    this.onProgress(socketId, msg.fileId, 0, msg.size, false);
                } else if (msg.type === 'file-end') {
                    const transfer = this.receivedBuffers.get(socketId);
                    if (transfer && transfer.metadata.fileId === msg.fileId) {
                        const blob = new Blob(transfer.chunks, { type: transfer.metadata.fileType });
                        this.onFileReceived(transfer.metadata.name, blob);
                        this.receivedBuffers.delete(socketId);
                    }
                }
            } catch (e) {
            }
        } else if (data instanceof ArrayBuffer) {
            const transfer = this.receivedBuffers.get(socketId);
            if (transfer) {
                transfer.chunks.push(data);
                transfer.receivedBytes += data.byteLength;
                this.onProgress(socketId, transfer.metadata.fileId, transfer.receivedBytes, transfer.metadata.size, false);
            }
        }
    }
}
