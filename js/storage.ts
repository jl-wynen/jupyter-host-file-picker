export function setLatestPath(path: string) {
    localStorage.setItem("@jphf/latest-path", path);
}

export function getLatestPath(): string | null {
    return localStorage.getItem("@jphf/latest-path");
}
