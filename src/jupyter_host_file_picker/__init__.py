"""Widget for selecting files on the Jupyter host."""

import importlib.metadata
import logging
import os
import pathlib
from pathlib import Path
from typing import Any

import anywidget
import traitlets

from ._filesystem import inspect_file, is_hidden

try:
    __version__ = importlib.metadata.version("jupyter_host_file_picker")
except importlib.metadata.PackageNotFoundError:
    __version__ = "unknown"


class HostFilePicker(anywidget.AnyWidget):
    """Widget for selecting files on the Jupyter host."""

    _esm = pathlib.Path(__file__).parent / "static" / "widget.js"
    _css = pathlib.Path(__file__).parent / "static" / "widget.css"

    _initialPath = traitlets.Union(
        [traitlets.Unicode(), traitlets.Instance(type(None))]
    ).tag(sync=True)
    _pathSep = traitlets.Unicode().tag(sync=True)
    _selected = traitlets.List(trait=traitlets.Unicode()).tag(sync=True)
    _remember = traitlets.Bool().tag(sync=True)

    selected = traitlets.List(trait=traitlets.Instance(Path)).tag()

    def __init__(
        self, initial_path: os.PathLike[str] | str | None = None, remember: bool = True
    ) -> None:
        """Create a new host file picker.

        Parameters
        ----------
        initial_path:
            Start in this path.
            If not given, use the last path shown in a previous file picker or
            the current working directory.
        remember:
            If True, the file picker stores information about where on the filesystem
            you navigate and how you configure the file picker.
            When you open a new file picker, it loads the saved information.
            All data is stored in your browser.
        """
        super().__init__(
            _initialPath=None
            if initial_path is None
            else _format_folder_path(Path(initial_path).absolute()),
            _pathSep=os.sep,
            _remember=remember,
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
            message = _list_dir(
                Path(content["payload"]["path"]), content["payload"]["showHidden"]
            )
        case "req:list-parent":
            message = _list_parent(
                Path(content["payload"]["path"]), content["payload"]["showHidden"]
            )
        case "req:list-home":
            message = _list_dir(Path.home(), content["payload"]["showHidden"])
        case "req:list-cwd":
            message = _list_dir(Path.cwd(), content["payload"]["showHidden"])
        case "req:list-dir-with-fallback":
            message = _list_dir_with_fallback(
                Path(content["payload"]["path"]), content["payload"]["showHidden"]
            )
        case _:
            logging.getLogger(__name__).warning("Unknown message type: %s", content)

    if message is not None:
        widget.send(message)


def _list_dir(path: Path, show_hidden: bool) -> dict[str, Any] | None:
    if not path.is_dir():
        if (res := inspect_file(path)) is None:
            return None
        payload = {
            "path": os.fspath(path),  # not a folder path
            "files": [res],
            "isFile": True,
        }
    else:
        if show_hidden:

            def filter_path(p: Path) -> bool:
                return True
        else:

            def filter_path(p: Path) -> bool:
                return not is_hidden(p)

        files = [
            res for p in path.iterdir() if filter_path(p) and (res := inspect_file(p))
        ]
        payload = {"path": _format_folder_path(path), "files": files, "isFile": False}

    return {"type": "res:list-dir", "payload": payload}


def _list_dir_with_fallback(path: Path, show_hidden: bool) -> dict[str, Any] | None:
    requested = _list_dir(path, show_hidden)
    if requested is None:
        return _list_dir(Path.cwd(), show_hidden)
    return requested


def _list_parent(path: Path, show_hidden: bool) -> dict[str, Any] | None:
    return _list_dir(path.parent, show_hidden)


def _format_folder_path(path: Path) -> str:
    """Return a str for a path with trailing separator."""
    raw = os.fspath(path)
    if raw.endswith(os.sep):
        return raw
    return raw + os.sep
