import type { AnyModel, RenderProps } from "@anywidget/types";
import "./widget.css";
import { FileInfo, ResListDirPayload, BackendComm } from "./comm.ts";
import { FolderView, FileMarkedEvent, FileSelectedEvent } from "./folderView.ts";
import { button, iconButton } from "./components.ts";
import { backIcon, closeIcon, forwardIcon, upIcon } from "./icons.ts";
import { SelectButton } from "./selectButton.ts";
import { makeDraggable, makeResizable } from "./windowing.ts";
import { PathState, PathView } from "./path.ts";

interface WidgetModel {
    _initialPath: string;
    _pathSep: string;
    _selected: string[];
}

function render({ model, el }: RenderProps<WidgetModel>) {
    const comm = new BackendComm(model);
    const pathState = new PathState(model.get("_initialPath"));

    el.classList.add("jupyter-host-file-picker");
    el.style.position = "relative";
    el.style.display = "none";

    const dialog = document.createElement("dialog");
    dialog.className = "jphf-dialog";

    const [header, pathView] = renderHeader(dialog, comm, model, pathState);
    dialog.appendChild(header);

    const content = document.createElement("div");
    content.className = "jphf-dialog-content";
    const folderView = new FolderView();
    content.appendChild(folderView.element);

    function selectFiles(fileInfos: FileInfo[]) {
        // TODO handle multiple files
        const fileInfo = fileInfos[0];
        if (fileInfo.type === "folder") {
            // Set early to update before possibly slow response comes back:
            pathView.setToProspective(fileInfo.path);
            folderView.showLoading();
            comm.sendReqListDir({ path: fileInfo.path });
        } else {
            model.set("_selected", [fileInfo.path]);
            model.save_changes();
            dialog.close();
        }
    }

    folderView.addEventListener("file-selected", (e: Event) => {
        const event = e as FileSelectedEvent;
        selectFiles(event.fileInfo);
    });
    comm.onResListDir((payload: ResListDirPayload) => {
        if (payload.isFile) {
            selectFiles(payload.files);
        } else {
            // TODO check folder path to make sure we get the message for the correct folder
            pathView.setTo(payload.path);
            pathState.insertNew(payload.path);
            folderView.populate(payload.files);
        }
    });
    folderView.showLoading();
    comm.sendReqListDir({ path: pathState.current });

    dialog.appendChild(content);

    const [footer, selectButton] = renderFooter(dialog);
    dialog.appendChild(footer);
    folderView.addEventListener("file-marked", (e: Event) => {
        const event = e as FileMarkedEvent;
        selectButton.onFileMarked(event.fileInfo);
    });
    selectButton.addEventListener("click", () => {
        selectFiles(folderView.selectedFiles);
    });

    const dragCleanup = makeDraggable(dialog, header);
    const resizeCleanup = makeResizable(dialog);
    dialog.addEventListener("keydown", (event: KeyboardEvent) => {
        if (event.key === "Escape") {
            dialog.close();
        }
    });

    document.body.appendChild(dialog);
    dialog.show();

    return () => {
        dialog.remove();
        dragCleanup();
        resizeCleanup();
    };
}

function renderHeader(
    dialog: HTMLDialogElement,
    comm: BackendComm,
    model: AnyModel<WidgetModel>,
    pathState: PathState,
): [HTMLElement, PathView] {
    const header = document.createElement("header");
    header.classList.add("jphf-nav-bar");

    const backButton = iconButton(backIcon, "Previous folder", () => {});
    backButton.setAttribute("disabled", "");
    header.appendChild(backButton);
    const forwardButton = iconButton(forwardIcon, "Next folder", () => {});
    forwardButton.setAttribute("disabled", "");
    header.appendChild(forwardButton);
    header.appendChild(
        iconButton(upIcon, "Parent folder", () => {
            pathView.setToParentProspective();
            comm.sendReqListParent({ path: pathState.current });
        }),
    );

    const pathView = new PathView(pathState, model.get("_pathSep"));
    pathView.onInput((path: string) => comm.sendReqListDir({ path }));
    // Do not move the window from the input element:
    pathView.element.addEventListener("mousedown", (e: MouseEvent) =>
        e.stopPropagation(),
    );
    header.appendChild(pathView.element);

    const closeButton = iconButton(closeIcon, "Close the file picker", () => {
        dialog.close();
    });
    closeButton.classList.add("jphf-close-button");
    header.appendChild(closeButton);

    return [header, pathView];
}

function renderFooter(dialog: HTMLDialogElement): [HTMLElement, SelectButton] {
    const footer = document.createElement("footer");
    footer.classList.add("jphf-footer");

    footer.append(button("Cancel", "Cancel", () => dialog.close()));
    const selectButton = new SelectButton();
    footer.append(selectButton.element);

    return [footer, selectButton];
}

export default { render };
