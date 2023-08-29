import {serveDir} from "https://deno.land/std@0.199.0/http/file_server.ts";
import * as path from "https://deno.land/std@0.197.0/path/mod.ts";

let latestData: Uint8Array;
const broadcasterEvent = new Event("broadcastupdate");

Deno.serve((req) => {
  const url = new URL(req.url);
  const pathname = url.pathname;
  const moduleDir = path.dirname(path.fromFileUrl(Deno.mainModule));
  const publicDir = path.join(moduleDir, "public");
  if (pathname.startsWith("/broadcaster")) {
    return serveDir(req, {
      fsRoot: publicDir,
    });
  } else if (pathname.startsWith("/viewer")) {
    return serveDir(req, {
      fsRoot: publicDir
    });
  }

  if (req.headers.get("upgrade") == "websocket") {
    const { socket, response } = Deno.upgradeWebSocket(req);
    socket.addEventListener("open", async() => {
          socket.addEventListener("message", ({ data }) => {
            latestData = new TextEncoder().encode(data);
            dispatchEvent(broadcasterEvent);
          });
      });
    socket.addEventListener("close", () => {});
    return response;
  }
  const aborter = new AbortController();
  const { signal } = aborter; 
  const body = new ReadableStream({
    start(controller) {
      controller.enqueue(latestData);
      addEventListener("broadcastupdate", (event)=>{
        controller.enqueue(latestData);
      },{signal});
    },
    cancel() {
      aborter.abort();
    },
  });
  return new Response(body, {
    headers: {
        "Cache-Control": "no-cache",
        "Content-Type": "text/event-stream",
        "Access-Control-Allow-Origin": "*",
    },
  });
});


