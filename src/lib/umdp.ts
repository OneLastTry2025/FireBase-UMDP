
"use client";

function simpleChecksum(str: string): string {
    let sum = 0;
    for (let i = 0; i < str.length; i++) {
        sum = (sum + str.charCodeAt(i)) % 65536;
    }
    return sum.toString(16).padStart(4, '0');
}

class SandboxEncoder {
    private key: string;
    private salt: string;

    constructor(key: string, salt: string) {
        this.key = key;
        this.salt = salt;
    }

    private transform(input: string): string {
        const fullKey = this.salt + this.key;
        let output = '';
        for (let i = 0; i < input.length; i++) {
            const charCode = input.charCodeAt(i) ^ fullKey.charCodeAt(i % fullKey.length);
            output += String.fromCharCode(charCode);
        }
        return output;
    }

    encode(text: string): string {
        if (typeof window === 'undefined') return '';
        try {
            const transformed = this.transform(text);
            return window.btoa(transformed);
        } catch (e) {
            console.error("Encoding failed", e);
            return '';
        }
    }

    decode(encoded: string): string {
        if (typeof window === 'undefined') return '';
        try {
            const decodedB64 = window.atob(encoded);
            return this.transform(decodedB64);
        } catch (e) {
            console.error("Decoding failed", e);
            throw new Error("Invalid Base64 sequence.");
        }
    }
}

export class UMDProtocol {
    public sessionId: string;
    private sequence: number = 0;
    private encoder: SandboxEncoder;
    public lastSender: 'A' | 'B' | null = null;

    constructor(sessionId?: string) {
        this.sessionId = sessionId || crypto.randomUUID();
        this.encoder = new SandboxEncoder('devgpt-key', 'devgpt-salt');
    }

    pack(message: string, sender: 'A' | 'B'): string {
        if (this.lastSender === sender) {
            throw new Error(`Wait for a response before sending from ${sender}.`);
        }
        const nextSequence = this.sequence + 1;
        const encodedPayload = this.encoder.encode(message);
        const checksum = simpleChecksum(encodedPayload);
        return `UMDP:${this.sessionId}:${sender}:${nextSequence}:${checksum}:${encodedPayload}`;
    }

    unpack(datagram: string): { message: string, sender: 'A' | 'B' } {
        const parts = datagram.trim().split(':');
        if (parts.length !== 6 || parts[0] !== 'UMDP') {
            throw new Error("Invalid datagram: Incorrect format.");
        }

        const [_, sessionId, sender, seqStr, checksum, payload] = parts as [string, string, 'A' | 'B', string, string, string];
        
        if (sessionId !== this.sessionId) {
            throw new Error(`Invalid datagram: Session ID mismatch. Expected ${this.sessionId}.`);
        }

        if (sender === this.lastSender) {
            throw new Error(`Invalid datagram: Unexpected sender. Waiting for a message from the other party.`);
        }

        const calculatedChecksum = simpleChecksum(payload);
        if (checksum !== calculatedChecksum) {
            throw new Error("Invalid datagram: Data corruption detected (checksum mismatch).");
        }
        
        const seq = parseInt(seqStr, 10);
        const expectedSeq = this.sequence + 1;
        if (isNaN(seq) || seq !== expectedSeq) {
            throw new Error(`Invalid datagram: Sequence error. Expected packet ${expectedSeq}, got ${seq}.`);
        }
        
        const message = this.encoder.decode(payload);

        // On success, update state
        this.sequence = seq;
        this.lastSender = sender;

        return { message, sender };
    }
}
