import {
    fileIcon,
    folderIcon,
    markdownIcon,
    LabIcon,
    imageIcon,
    notebookIcon,
    jsonIcon,
    pythonIcon,
    spreadsheetIcon,
    homeIcon as jpHomeIcon,
    caretUpIcon,
    pdfIcon,
    videoIcon,
    refreshIcon,
    yamlIcon,
    closeIcon as jpCloseIcon,
} from "@jupyterlab/ui-components";
import hdfSvg from "./assets/hdf.svg";
import stepBackward from "./assets/step-backward.svg";

const hdfIcon = new LabIcon({ name: "jphf:hdf", svgstr: hdfSvg });
const stepBackwardIcon = new LabIcon({
    name: "jphf:step-backward",
    svgstr: stepBackward,
});

export function iconForFileType(fileType: string): LabIcon {
    switch (fileType) {
        case "folder":
            return folderIcon;
        case "hdf":
            return hdfIcon;
        case "image":
            return imageIcon;
        case "ipynb":
            return notebookIcon;
        case "json":
            return jsonIcon;
        case "markdown":
            return markdownIcon;
        case "pdf":
            return pdfIcon;
        case "python":
            return pythonIcon;
        case "spreadsheet":
            return spreadsheetIcon;
        case "video":
            return videoIcon;
        case "yaml":
            return yamlIcon;
        default:
            return fileIcon;
    }
}
export const workingDirIcon = stepBackwardIcon;
export const circleArrowIcon = refreshIcon;
export const closeIcon = jpCloseIcon;
export const homeIcon = jpHomeIcon;
export const upIcon = caretUpIcon;
