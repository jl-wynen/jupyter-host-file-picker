/**
 * Make an element draggable by dragging a trigger element.
 *
 * The trigger element must be positioned inside `element`.
 * @param element HTML element to drag.
 *                Must have `position: fixed`.
 * @param triggerElement HTML element that triggers dragging
 *                       when the user presses the mouse inside.
 * @returns A function to remove the event listeners.
 */
export function makeDraggable(
    element: HTMLElement,
    triggerElement: HTMLElement,
): () => void {
    let isDragging = false;

    // Mouse position when dragging is started:
    let startX = 0;
    let startY = 0;
    // Window position when dragging started:
    let startLeft = 0;
    let startTop = 0;

    // Minimum visible distance in all directions in pixels:
    const minVisible = 30;

    triggerElement.addEventListener("mousedown", (e) => {
        const target = e.target as HTMLElement | null;
        if (
            target?.closest(
                'button, input, textarea, select, option, a, [role="button"]',
            )
        ) {
            // Do not allow dragging from interactive elements.
            return;
        }

        element.classList.add("jphf-dragging");
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;

        const rect = element.getBoundingClientRect();
        startLeft = rect.left;
        startTop = rect.top;

        e.preventDefault();
    });

    const onMouseMove = (e: MouseEvent) => {
        if (!isDragging) return;

        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        const rect = element.getBoundingClientRect();
        const triggerHeight = triggerElement.offsetHeight;

        // Compute the new top-left corner and ensure at least
        // some part of the trigger element is visible.
        const newLeft = clamp(
            startLeft + dx,
            -(rect.width - minVisible),
            viewportWidth - minVisible,
        );
        const newTop = clamp(
            startTop + dy,
            -(triggerHeight - minVisible),
            viewportHeight - minVisible,
        );

        element.style.left = `${newLeft}px`;
        element.style.top = `${newTop}px`;
    };

    const onMouseUp = () => {
        element.classList.remove("jphf-dragging");
        isDragging = false;
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
    };
}

/**
 * Make an element resizable by clicking and dragging around the border.
 *
 * @param element HTML element to resize.
 * @returns A function to remove the event listeners.
 */
export function makeResizable(element: HTMLElement): () => void {
    let isResizing = false;
    let currentDirection = 0; // initial value does not matter

    // Mouse position when dragging is started:
    let startX = 0;
    let startY = 0;
    // Window position and size when dragging started:
    let startLeft = 0;
    let startTop = 0;
    let startWidth = 0;
    let startHeight = 0;

    // Minimum visible distance in all directions in pixels:
    const minVisible = 30;

    const directions = [t, t | l, l, l | b, b, b | r, r, r | t];
    directions.forEach((direction) => {
        const resizer = createResizer(direction);
        element.appendChild(resizer);

        resizer.addEventListener("mousedown", (e) => {
            isResizing = true;
            currentDirection = direction;
            startX = e.clientX;
            startY = e.clientY;

            const rect = element.getBoundingClientRect();
            startLeft = rect.left;
            startTop = rect.top;
            startWidth = rect.width;
            startHeight = rect.height;

            e.preventDefault();
            // in case there is a different element below the resizer
            e.stopPropagation();
        });
    });

    const onMouseMove = (e: MouseEvent) => {
        if (!isResizing) return;

        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // Clamp to make sure the window never gets resized past the viewport.
        // This leads to some odd behavior where dragging the top / left edge past the
        // bottom / right edge, respectively, moves the dialog.
        const dx = clamp(e.clientX, 0, viewportWidth) - startX;
        const dy = clamp(e.clientY, 0, viewportHeight) - startY;

        if (currentDirection & t) {
            const newHeight = startHeight - dy;
            const newTop = clamp(
                startTop + (startHeight - newHeight),
                0,
                viewportHeight - minVisible,
            );
            element.style.height = `${newHeight}px`;
            element.style.top = `${newTop}px`;
        } else if (currentDirection & b) {
            const newHeight = startHeight + dy;
            element.style.height = `${newHeight}px`;
        }

        if (currentDirection & l) {
            const newWidth = startWidth - dx;
            const newLeft = clamp(
                startLeft + (startWidth - newWidth),
                0,
                viewportWidth - minVisible,
            );
            element.style.width = `${newWidth}px`;
            element.style.left = `${newLeft}px`;
        } else if (currentDirection & r) {
            const newWidth = startWidth + dx;
            element.style.width = `${newWidth}px`;
        }
    };

    const onMouseUp = () => {
        isResizing = false;
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
    };
}

// Resize directions:
const t = 0b0001;
const b = 0b0010;
const r = 0b0100;
const l = 0b1000;

// Width / height of resizers in em:
const resizerSizeEm = 0.5;

function createResizer(direction: number): HTMLDivElement {
    const resizer = document.createElement("div");
    resizer.classList.add("jphf-resizer");

    let directionName = "";

    if (direction & t) {
        resizer.style.top = `-${resizerSizeEm / 2}em`;
        resizer.style.height = `${resizerSizeEm}em`;
        directionName = "n";
    } else if (direction & b) {
        resizer.style.bottom = `-${resizerSizeEm / 2}em`;
        resizer.style.height = `${resizerSizeEm}em`;
        directionName = "s";
    } else {
        resizer.style.top = "0";
        resizer.style.bottom = "0";
    }

    if (direction & l) {
        resizer.style.left = `-${resizerSizeEm / 2}em`;
        resizer.style.width = `${resizerSizeEm}em`;
        directionName += "w";
    } else if (direction & r) {
        resizer.style.right = `-${resizerSizeEm / 2}em`;
        resizer.style.width = `${resizerSizeEm}em`;
        directionName += "e";
    } else {
        resizer.style.left = "0";
        resizer.style.right = "0";
    }

    resizer.style.cursor = `${directionName}-resize`;

    return resizer;
}

function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(value, max));
}
