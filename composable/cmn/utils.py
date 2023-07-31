import os


def remove_newlines_from_dict(data):
    return {
        k: v.replace("\n", " ") if isinstance(v, str) else v for k, v in data.items()
    }


def file_exists(file_path):
    return os.path.isfile(file_path)
