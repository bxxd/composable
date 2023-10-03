import os
from types import SimpleNamespace


def remove_newlines_from_dict(data):
    return {
        k: v.replace("\n", " ") if isinstance(v, str) else v for k, v in data.items()
    }


def file_exists(file_path):
    return os.path.isfile(file_path)


def namespace_to_dict(namespace_obj: SimpleNamespace) -> dict:
    return vars(namespace_obj)
