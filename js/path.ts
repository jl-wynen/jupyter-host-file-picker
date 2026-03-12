import { setLatestPath } from "./storage.ts";

export class PathView {
    private path: string;
    private readonly pathSep: string;
    private readonly remember: boolean;
    private readonly el: HTMLInputElement;

    constructor(path: string, pathSep: string, remember: boolean) {
        this.path = path;
        this.pathSep = pathSep;
        this.remember = remember;
        this.el = document.createElement("input");
        this.el.type = "text";
        this.el.value = path;
    }

    get element(): HTMLInputElement {
        return this.el;
    }

    get current(): string {
        return this.path;
    }

    setTo(path: string) {
        this.path = path;
        this.el.value = path;
        if (this.remember) {
            setLatestPath(path);
        }
    }

    /** Set the displayed value to the given path.
     *
     * This does not add the path to the path state and history.
     * So this function should only be used for a quick display
     * update before the proper path is available.
     */
    setToProspective(path: string) {
        this.el.value = `${path}${this.pathSep}`;
    }

    /** Set the displayed value to the parent of the current path.
     *
     * This does not add the path to the path state and history.
     * So this function should only be used for a quick display
     * update before the proper path is available.
     */
    setToParentProspective() {
        let current = this.current;
        if (current.endsWith(this.pathSep)) {
            current = current.slice(0, -1);
        }
        const index = current.lastIndexOf(this.pathSep);
        if (index === -1) {
            this.el.value = "";
        } else {
            this.el.value = current.slice(0, index) + this.pathSep;
        }
    }

    onInput(callback: (path: string) => void) {
        this.el.addEventListener("keydown", (event: KeyboardEvent) => {
            if (event.key === "Enter") {
                callback(this.el.value);
            }
        });
    }
}
