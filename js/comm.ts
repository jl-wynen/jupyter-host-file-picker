import { AnyModel } from "@anywidget/types";
import { FileType } from "./fileType";

export type FileInfo = {
    modified: string;
    name: string;
    path: string;
    size: number;
    type: FileType;
};

/** Request listing a directory. */
export type ReqListDirPayload = {
    path: string;
};

/** Response for listing a directory. */
export type ResListDirPayload = {
    path: string;
    files: FileInfo[];
    isFile: boolean;
};

/** Request listing the parent of a directory.
 *
 * The response to this request comes in as "res:list-dir".
 */
export type ReqListParentPayload = {
    path: string;
};

export class BackendComm {
    private readonly model: AnyModel<any>;
    private callbacks = new Map<string, (payload: any) => void>();

    constructor(model: AnyModel<any>) {
        this.model = model;

        this.model.on("msg:custom", (message: any) => {
            if (message.hasOwnProperty("type")) {
                const callback = this.callbacks.get(message["type"]);
                if (callback) {
                    callback(message["payload"]);
                }
                return;
            }
            console.warn(`Unknown message type: ${message}`);
        });
    }

    sendReqListDir(payload: ReqListDirPayload) {
        this.model.send({ type: "req:list-dir", payload });
    }

    onResListDir(callback: (payload: ResListDirPayload) => void) {
        this.callbacks.set("res:list-dir", callback);
    }

    sendReqListParent(payload: ReqListParentPayload) {
        this.model.send({ type: "req:list-parent", payload });
    }

    sendReqListHome() {
        this.model.send({ type: "req:list-home", payload: {} });
    }

    sendReqListCwd() {
        this.model.send({ type: "req:list-cwd", payload: {} });
    }

    /**
     * List contents of a directory if possible, else list contents of CWD.
     */
    sendReqListDirWithFallback(payload: ReqListDirPayload) {
        this.model.send({ type: "req:list-dir-with-fallback", payload });
    }
}
