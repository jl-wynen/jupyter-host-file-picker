import { LabIcon } from "@jupyterlab/ui-components";

/**
 * Create a button with text.
 * @param label Text for the button.
 * @param title Tooltip and aria label for the button.
 * @param callback Callback to be invoked when the button is clicked.
 */
export function button(
    label: string,
    title: string,
    callback: (this: HTMLButtonElement, ev: PointerEvent) => any,
): HTMLButtonElement {
    const button = document.createElement("button");
    button.textContent = label;
    button.classList.add("jphf-button");
    button.classList.add("jupyter-button");
    button.setAttribute("aria-label", title);
    button.title = title;
    button.addEventListener("click", callback);
    return button;
}

/**
 * Create a button with an icon.
 * @param icon LabIcon for the button.
 * @param title Tooltip and aria label for the button.
 * @param callback Callback to be invoked when the button is clicked.
 */
export function iconButton(
    icon: LabIcon,
    title: string,
    callback: (this: HTMLButtonElement, ev: PointerEvent) => any,
): HTMLButtonElement {
    const button = document.createElement("button");
    button.classList.add("jphf-icon-button");
    icon.element({ container: button });
    button.setAttribute("aria-label", title);
    button.title = title;
    button.addEventListener("click", callback);
    return button;
}
