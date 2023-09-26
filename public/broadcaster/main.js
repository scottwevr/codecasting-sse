let cmEditorElement = document.querySelector(".cm-editor");
let view = cmEditorElement.querySelector(".cm-content").cmView.view;
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

const sketchContainer = document.querySelector(".wrapper");
const consoleContainer = document.querySelector(".console-container");
const runButton = document.querySelector(".run-code");

makeFloating(sketchContainer, 0b1111, consoleContainer);
makeFloating(consoleContainer, 0b0100);

function makeFloating(
  element,
  resizeMask = 0b1111,
  follower = null,
  sensitivity = 4
) {
  let cursorMask = 0b0000;
  const n = 0b1000,
    s = 0b0100,
    e = 0b0010,
    w = 0b0001;
  element.addEventListener("pointermove", ({ target, x, y }) => {
    const rect = element.getBoundingClientRect();
    cursorMask = 0;
    cursorMask |= y - rect.y < sensitivity ? n : 0;
    cursorMask |= rect.y + rect.height - y < sensitivity ? s : 0;
    cursorMask |= rect.x + rect.width - x < sensitivity ? e : 0;
    cursorMask |= x - rect.x < sensitivity ? w : 0;
    cursorMask &= resizeMask;
    switch (cursorMask) {
      case 0b1010:
      case 0b0101:
        target.style.cursor = "nesw-resize";
        break;
      case 0b1001:
      case 0b0110:
        target.style.cursor = "nwse-resize";
        break;
      case 0b1000:
      case 0b0100:
        target.style.cursor = "ns-resize";
        break;
      case 0b0001:
      case 0b0010:
        target.style.cursor = "ew-resize";
        break;
      default:
        target.style.cursor = target.tagName === "HEADER" ? "move" : "default";
    }
  });

  element.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    if (event.target.className === "close") {
      element?.close();
      follower?.close();
    }
    const { x, y, target } = event;
    const rect = element.getBoundingClientRect();
    const matrix = new DOMMatrix(
      element.style.transform ?? window.getComputedStyle(element).transform
    );
    const controller = new AbortController();
    const { signal } = controller;
    const loc = cursorMask;
    const isTranslating = target.tagName === "HEADER" && loc === 0;
    window.addEventListener(
      "pointermove",
      (event) => {
        if (isTranslating) {
          const translation = matrix
            .translate(event.x - x, event.y - y)
            .toString();
          element.style.transform = translation;
        } else {
          let matrixCopy = new DOMMatrix(matrix);
          if ((loc & n) > 0) {
            element.style.height = `${rect.height + (y - event.y)}px`;
            element.style.transform = matrixCopy
              .translateSelf(0, event.y - y)
              .toString();
          }
          if ((loc & s) > 0) {
            element.style.height = `${rect.height - (y - event.y)}px`;
          }
          if ((loc & e) > 0) {
            element.style.width = `${rect.width - (x - event.x)}px`;
          }
          if ((loc & w) > 0) {
            element.style.width = `${rect.width - (event.x - x)}px`;
            element.style.transform = matrixCopy
              .translate(event.x - x, 0)
              .toString();
          }
        }
        if (follower) {
          follower.style.transform = element.style.transform.replace(/(\d+)(?!.*\d)/g, "0");
          const { bottom, left, width } = element.getBoundingClientRect();
          follower.style.top = `${bottom}px`;
          follower.style.width = `${width}px`;
        }
      },
      { signal }
    );
    window.addEventListener("pointerup", () => controller.abort(), { signal });
  });
}

runButton.addEventListener("pointerdown", (event) => {
  sketchContainer.show();
  consoleContainer.show();
  sketchContainer.style.transform = new DOMMatrix().toString();
  consoleContainer.style.transform = new DOMMatrix().toString();
  sketchContainer.style.width = `400px`;
  sketchContainer.style.height = `400px`;
  consoleContainer.style.width = `400px`;
  consoleContainer.style.height = `100px`;
  const rect = sketchContainer.getBoundingClientRect();
  consoleContainer.style.top = `${rect.bottom}px`;
  consoleContainer.style.left = `${rect.left}px`;

  const getBlobURL = (code, type) => {
    const blob = new Blob([code], { type });
    return URL.createObjectURL(blob);
  };

  const cssURL = getBlobURL(
    `html, body {
  margin: 0;
  padding: 0;
}
canvas {
  display: block;
}`,
    "text/css"
  );
  const jsURL = getBlobURL(view.state.doc.toString(),
  "application/javascript"
);
  const htmlURL = getBlobURL(
    `
   <!DOCTYPE html>
    <html>
      <head>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.7.0/p5.js"></script>
<script>window.console = new Proxy(window.console, {
    get(target, key) {
       const p = target[key];
       if (['error', 'info', 'log', 'warn'].includes(key)) {
          return async function(...args) {
             //p.apply(target, args);
             window.parent.postMessage(args, "*");
          }
       }  
    },
 });
</script>
        <link rel="stylesheet" type="text/css" href="${cssURL}" />
        <meta charset="utf-8" />
      </head>
      <body>
        <script src="${jsURL}"></script>
      </body>
    </html>
  `,
    "text/html"
  );
  const iframe = sketchContainer.querySelector(".content");
  iframe.src = htmlURL;
  sketchContainer.addEventListener("close", (event) => {
    URL.revokeObjectURL(htmlURL);
    URL.revokeObjectURL(cssURL);
    URL.revokeObjectURL(htmlURL);
    iframe.src = "about:blank";
  });
});

window.addEventListener(
  "message",
  (event) => {
    consoleContainer.insertAdjacentHTML(
      "afterbegin",
      `<span>${event.data}</span>`
    );
    consoleContainer.scrollIntoView({ block: "end" });
  },

  false
);
