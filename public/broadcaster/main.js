async function beginCodecast() {
  const signalingServer = new WebSocket(`wss://${window.location.host}`);
    await new Promise((resolve) =>
    signalingServer.addEventListener("open", resolve)
  );
  addEventListener("editorChanged",(event)=>{
    const lines = event.detail.split("\n").reduce((acc, line)=> `${acc}data: ${line}\n`, ``);
    signalingServer.send(`${lines}\n`);
  });
}
beginCodecast();

