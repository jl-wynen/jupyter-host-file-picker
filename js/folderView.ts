import { FileInfo } from "./comm.ts";
import { iconForFileType } from "./icons.ts";
import { humanSize, approxDurationSince } from "./output.ts";

export class FolderView extends EventTarget {
    private readonly container: HTMLDivElement;
    private fileInfos: FileInfo[] = [];
    private currentIndex: number | null = null;
    private loadingTimeout: number | null = null;
    private refreshInterval?: number;

    constructor() {
        super();
        this.container = document.createElement("div");
        this.container.classList.add("jphf-folder-view");

        this.container.addEventListener("keydown", (event: KeyboardEvent) => {
            if (event.key === "ArrowDown") {
                event.preventDefault();
                const next = Math.min(
                    (this.currentIndex ?? -1) + 1,
                    this.fileInfos.length - 1,
                );
                this.setCurrent(next);
            } else if (event.key === "ArrowUp") {
                event.preventDefault();
                const next = Math.max(
                    (this.currentIndex ?? this.fileInfos.length - 1) - 1,
                    0,
                );
                this.setCurrent(next);
            } else if (event.key === "Home") {
                event.preventDefault();
                this.setCurrent(0);
            } else if (event.key === "End") {
                this.setCurrent(this.fileInfos.length - 1);
            } else if (event.key === "Enter" || event.key == "NumpadEnter") {
                event.preventDefault();
                event.stopPropagation();
                this.dispatchEvent(new FileSelectedEvent(this.selectedFiles));
            }
        });

        // @ts-ignore
        this.refreshInterval = setInterval(() => this.refreshModifiedDates(), 60_000);
    }

    get element() {
        return this.container;
    }

    get selectedFiles(): FileInfo[] {
        let selected = [];
        for (const row of this.container.querySelectorAll(
            "[role='option'][aria-selected='true']",
        )) {
            selected.push(this.fileInfos[Number((row as HTMLElement).dataset.index)]);
        }
        return selected;
    }

    showLoading() {
        this.clearLoading();
        // @ts-ignore
        this.loadingTimeout = setTimeout(() => {
            const loading = document.createElement("div");
            loading.className = "jphf-loading";
            loading.textContent = "Loading folder ...";
            this.container.replaceChildren(loading);
        }, 300);
    }

    private clearLoading() {
        if (this.loadingTimeout !== null) {
            clearTimeout(this.loadingTimeout);
            this.loadingTimeout = null;
        }
    }

    private refreshModifiedDates() {
        if (!this.container.isConnected && this.refreshInterval !== null) {
            // Automatically stop refreshing if the container has been removed.
            this.stopRefreshing();
            return;
        }

        const now = new Date();
        const cells = this.container.querySelectorAll(".jphf-file-modified-cell");
        for (const cell of cells) {
            if (cell instanceof HTMLTableCellElement && cell.title) {
                const date = new Date(cell.title);
                if (!isNaN(date.getTime())) {
                    cell.textContent = approxDurationSince(date, now);
                }
            }
        }
    }

    private stopRefreshing() {
        clearInterval(this.refreshInterval);
        this.refreshInterval = undefined;
    }

    private setCurrent(index: number) {
        const table = this.container.querySelector("table")!;
        const rows = Array.from(table.querySelectorAll("[role='option']"));
        for (const row of rows) {
            row.ariaSelected = "false";
        }

        const currentRow = rows[index];
        this.currentIndex = index;
        currentRow.ariaSelected = "true";
        table.ariaActiveDescendantElement = currentRow;
        currentRow.scrollIntoView({ block: "nearest" });
    }

    populate(files: FileInfo[]) {
        this.clearLoading();
        this.fileInfos = files.sort((a, b) => {
            // Folders first
            if (a.type === "folder" && b.type !== "folder") return -1;
            if (a.type !== "folder" && b.type === "folder") return 1;
            // then alphabetically
            return a.name.localeCompare(b.name);
        });

        const now = new Date(Date.now());
        const [table, tbody] = createFileTableElement();
        for (const [index, info] of files.entries()) {
            const row = tbody.insertRow();
            row.id = `jphf-file-${index}`;
            row.dataset.index = index.toString();
            row.classList.add("jphf-file-list-item");
            row.role = "option";
            row.ariaSelected = "false";

            const iconCell = row.insertCell();
            iconCell.classList.add("jphf-file-icon-cell");
            iconForFileType(info.type).element({
                container: iconCell,
                width: "1em",
                height: "1em",
            });

            const nameCell = row.insertCell();
            nameCell.textContent = info.name;
            nameCell.classList.add("jphf-file-name-cell");

            const sizeCell = row.insertCell();
            sizeCell.classList.add("jphf-file-size-cell");
            if (info.size !== null) {
                sizeCell.replaceChildren(humanSize(info.size));
            }

            const modifiedCell = row.insertCell();
            modifiedCell.classList.add("jphf-file-modified-cell");
            const date = new Date(info.modified);
            modifiedCell.textContent = approxDurationSince(date, now);
            modifiedCell.title = date.toISOString();

            row.addEventListener("mousedown", (event: MouseEvent) => {
                if (event.detail > 1) {
                    // Do not select text on double-click
                    event.preventDefault();
                }
            });

            row.addEventListener("click", (event: MouseEvent) => {
                event.preventDefault();
                table.focus();
                this.setCurrent(index);
            });

            row.addEventListener("dblclick", (event: MouseEvent) => {
                event.preventDefault();
                this.setCurrent(index);
                this.dispatchEvent(new FileSelectedEvent([info]));
            });
        }
        this.container.replaceChildren(table);
    }
}

export class FileSelectedEvent extends Event {
    constructor(public fileInfo: FileInfo[]) {
        super("file-selected");
    }
}

export class FileMarkedEvent extends Event {
    constructor(public fileInfo: FileInfo[]) {
        super("file-marked");
    }
}

function createFileTableElement(): [HTMLTableElement, HTMLTableSectionElement] {
    const table = document.createElement("table");
    table.classList.add("jphf-file-table");
    table.role = "listbox";
    table.ariaLabel = "Files";
    table.tabIndex = 0; // needs to be focusable for keyboard events

    const header = table.createTHead();
    const row = header.insertRow();

    const iconTh = document.createElement("th");
    iconTh.classList.add("jphf-file-icon-cell");
    row.appendChild(iconTh);

    const nameTh = document.createElement("th");
    nameTh.textContent = "Name";
    nameTh.classList.add("jphf-file-name-cell");
    row.appendChild(nameTh);

    const sizeTh = document.createElement("th");
    sizeTh.textContent = "Size";
    sizeTh.classList.add("jphf-file-size-cell");
    row.appendChild(sizeTh);

    const modifiedTh = document.createElement("th");
    modifiedTh.textContent = "Modified";
    modifiedTh.classList.add("jphf-file-modified-cell");
    row.appendChild(modifiedTh);

    const body = table.createTBody();

    return [table, body];
}
