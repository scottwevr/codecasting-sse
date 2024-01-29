import {serveDir} from "https://deno.land/std@0.211.0/http/file_server.ts";
import * as path from "https://deno.land/std@0.211.0/path/mod.ts";

let channel = new BroadcastChannel("codecast");
let latestData: Uint8Array;
let connected = new Set();
const broadcasterEvent = new Event("broadcastupdate");
channel.addEventListener("message", ({ data }) => {
  latestData = data;
  dispatchEvent(broadcasterEvent);
});
/*
setInterval(()=>{
    const bytes = Deno.memoryUsage().rss;
    console.log(Math.floor(bytes / (1024 * 1024) * 10) / 10);
  },5000);
  */
Deno.serve((req) => {
  const url = new URL(req.url);
  const pathname = url.pathname;
  const moduleDir = path.dirname(path.fromFileUrl(Deno.mainModule));
  const publicDir = path.join(moduleDir, "public");
  if (pathname.startsWith("/broadcaster")) {
    //console.log("broadcaster loaded page");
    return serveDir(req, {
      fsRoot: publicDir,
    });
  } else if (pathname.startsWith("/viewer")) {
    //console.log("viewer loaded page");
    return serveDir(req, {
      fsRoot: publicDir
    });
  }

  if (req.headers.get("upgrade") == "websocket") {
    //console.log("broadcaster joined");
    const { socket, response } = Deno.upgradeWebSocket(req);
    socket.addEventListener("open", async() => {
          socket.addEventListener("message", ({ data }) => {
            channel.postMessage(data);
            //latestData = new TextEncoder().encode(data);
            latestData = data;
            dispatchEvent(broadcasterEvent);
          });
      });
    socket.addEventListener("close", () => { 
      //console.log("broadcaster left");
    });
    return response;
  }
  else if(req.headers.get("accept") == "text/event-stream") {
  //console.log("viewer joined");
  const aborter = new AbortController();
  const { signal } = aborter; 
  const body = new ReadableStream({
    start(controller) {
      controller.enqueue(latestData);
      addEventListener("broadcastupdate", (event) => {
        controller.enqueue(latestData);
      },{signal});
      
    },
    cancel() {
      //console.log("viewer left");
      aborter.abort();
    },
  });
  return new Response(body.pipeThrough(new TextEncoderStream()), {
    headers: {
        "Cache-Control": "no-cache",
        "Content-Type": "text/event-stream",
        "Access-Control-Allow-Origin": "*",
    },
  });
}
return new Response("404 Not Found", { status: 404 });
});


