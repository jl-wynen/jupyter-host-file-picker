"""Widget for selecting files on the Jupyter host."""

import importlib.metadata
import logging
import os
import pathlib
from pathlib import Path
from typing import Any

import anywidget
import traitlets

from ._filesystem import inspect_file

try:
    __version__ = importlib.metadata.version("jupyter_host_file_picker")
except importlib.metadata.PackageNotFoundError:
    __version__ = "unknown"


class HostFilePicker(anywidget.AnyWidget):
    """Widget for selecting files on the Jupyter host."""

    _esm = pathlib.Path(__file__).parent / "static" / "widget.js"
    _css = pathlib.Path(__file__).parent / "static" / "widget.css"

    _initialPath = traitlets.Unicode().tag(sync=True)
    _pathSep = traitlets.Unicode().tag(sync=True)
    _selected = traitlets.List(trait=traitlets.Unicode()).tag(sync=True)

    selected = traitlets.List(trait=traitlets.Instance(Path)).tag()

    def __init__(self, initial_path: os.PathLike[str] | str = ".") -> None:
        initial_path = Path(initial_path).absolute()
        super().__init__(
            _initialPath=_format_folder_path(initial_path),
            _pathSep=os.sep,
        )

        self.on_msg(_handle_message)
        self.observe(self._sync_selected, names="_selected")

    def _sync_selected(self, change: dict[str, Any]) -> None:
        """Sync public ``selected`` to convert to Path objects."""
        self.selected = [Path(value) for value in change["new"]]


def _handle_message(
    widget: HostFilePicker, content: dict[str, Any], buffers: object
) -> None:
    message = None
    match content.get("type"):
        case "req:list-dir":
            message = _list_dir(Path(content["payload"]["path"]))
        case "req:list-parent":
            message = _list_parent(Path(content["payload"]["path"]))
        case "req:list-home":
            message = _list_dir(Path.home())
        case "req:list-cwd":
            message = _list_dir(Path.cwd())
        case _:
            logging.getLogger(__name__).warning("Unknown message type: %s", content)

    if message is not None:
        widget.send(message)


def _list_dir(path: Path) -> dict[str, Any] | None:
    if not path.is_dir():
        if (res := inspect_file(path)) is None:
            return None
        payload = {
            "path": os.fspath(path),  # not a folder path
            "files": [res],
            "isFile": True,
        }
    else:
        files = [res for p in path.iterdir() if (res := inspect_file(p))]
        payload = {"path": _format_folder_path(path), "files": files, "isFile": False}

    return {"type": "res:list-dir", "payload": payload}


def _list_parent(path: Path) -> dict[str, Any] | None:
    return _list_dir(path.parent)


def _format_folder_path(path: Path) -> str:
    """Return a str for a path with trailing separator."""
    raw = os.fspath(path)
    if raw.endswith(os.sep):
        return raw
    return raw + os.sep
