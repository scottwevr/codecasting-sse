let cmEditorElement = document.querySelector(".cm-editor");
let view = cmEditorElement.querySelector(".cm-content").cmView.view;


async function joinCodecast() {
    const evtSource = new EventSource(`//${window.location.host}`, { withCredentials: false } );
    evtSource.addEventListener("message", async (event) => {
        let {data} = event;
        view.dispatch({changes: {
            from: 0,
            to: view.state.doc.length,
            insert: data
            }});
    });
}

document.querySelector(".join").addEventListener("pointerdown", joinCodecast);
