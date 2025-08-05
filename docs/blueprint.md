# **App Name**: UMDP Relay

## Core Features:

- Message Encoding: Encode messages using XOR transformation and Base64 encoding.
- Message Decoding: Decode messages using Base64 decoding and XOR transformation.
- Datagram Packing: Package encoded messages into datagrams with session ID, sequence number, and checksum.
- Datagram Unpacking: Unpack datagrams and verify session ID, sequence number, and checksum for integrity.
- User Instruction Display: Display instructions for sending and receiving messages via command line interface.
- Session Management: Manage unique session IDs for secure message exchange.
- Corruption Reporting: Report data corruption in received packets to the user

## Style Guidelines:

- Primary color: Dark slate blue (#3B5998) to evoke trust and reliability in secure communications.
- Background color: Very dark gray (#222225), suitable for a dark color scheme.
- Accent color: Purple (#8A2BE2), an analogous color to the primary color, different enough in brightness to pop out.
- Font: 'Inter' sans-serif for both body and headlines, for a clean and modern terminal style
- Use simple, monochrome icons to indicate send and receive actions in the command-line interface.
- Maintain a clear, command-line-focused layout with distinct sections for input, output, and status messages.
- Subtle text animations for data transmission and verification processes to enhance user feedback.