# Server-sent event broadcast using Deno and WebSockets

This project demonstrates how to create a simple WebRTC data channel broadcast application using Deno for the server-side logic and WebSockets for signaling between clients.

## Prerequisites

Before you begin, make sure you have the following installed:

- [Deno](https://deno.land/)
- Web browser with SSE support (Chrome, Firefox, etc.)

## Getting Started

1. Clone this repository to your local machine:

   ```bash
   git clone https://github.com/scottwevr/codecasting-sse.git
   cd codecasting-sse
   ```

2. Install the Deno runtime by following the instructions on the [Deno website](https://deno.land/#installation).

3. Run the server:

   ```bash
   deno run --allow-net server.ts
   ```

   This will start the WebSocket signaling server on `http://localhost:8080`.

4. Open two tabs in the browser, navigating the first one to `http://localhost:8080/broadcaster` and the second to `http://localhost:8080/viewer`.

5. When the "Join Codecast" button is clicked on the viewer. This will open a connection with the server and listen for messages.

6. Any text that is typed into the broadcaster's text field will be sent to the viewer and displayed in their text field.

## Notes

- This project is for educational purposes and is far from  production-ready.
- If you are testing locally with localhost the websockets need to be changed from `wss` to `ws`.

## License

This project is licensed under the [MIT License](LICENSE).

---

