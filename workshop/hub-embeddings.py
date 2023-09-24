import asyncpg
import json
import asyncio

from composable.services.embeddings import get_embedding
from composable.cmn.db_utils import get_dns_edgar

import logging

log = logging.getLogger(__name__)


def extract_all_text(data):
    if isinstance(data, dict):
        # Initialize an empty list to collect text
        texts = []

        for key, value in data.items():
            # If the key is 'text', add it to the list
            if key == "text":
                texts.append(value)

            # If the value is a dictionary or list, recurse
            if isinstance(value, (dict, list)):
                texts.append(extract_all_text(value))

        # Join all the collected text and return
        return " ".join(texts)

    elif isinstance(data, list):
        # Initialize an empty list to collect text from each item
        texts = []

        # Loop through each item in the list
        for item in data:
            # Recurse into the item
            texts.append(extract_all_text(item))

        # Join all the collected text and return
        return " ".join(texts)

    else:
        # If the data is neither a dictionary nor a list, return an empty string
        return ""


import re
import json


def extract_deleted_rows_from_logs(log_file_path):
    deleted_rows = []
    with open(log_file_path, "r") as f:
        lines = f.readlines()
        for line in lines:
            if "Deleting row with id" in line:
                m = re.search("Deleting row with id (\d+)", line)
                if m:
                    deleted_id = int(m.group(1))
                    # Now let's find the corresponding data
                    for data_line in reversed(lines[: lines.index(line)]):
                        if f"Processing: {deleted_id} " in data_line:
                            m = re.search(f"Processing: {deleted_id} (.+)$", data_line)
                            if m:
                                deleted_data = m.group(1)
                                deleted_data = "".join(deleted_data.split("...")[:-1])

                                try:
                                    row = {
                                        "id": deleted_id,
                                        "data": json.loads(deleted_data),
                                    }
                                    deleted_rows.append(row)
                                except json.JSONDecodeError:
                                    print(
                                        f"Failed to parse JSON for id {deleted_id} with data {deleted_data}\n\n"
                                    )
                                    # return deleted_rows

                                break
    return deleted_rows


async def restore_deleted_rows(deleted_rows):
    dsn = get_dns_edgar().replace("+asyncpg", "")
    conn = await asyncpg.connect(dsn)
    try:
        for row in deleted_rows:
            id_ = row["id"]
            data = row["data"]
            data_str = json.dumps(data)
            await conn.execute(
                "INSERT INTO json_blobs (id, data) VALUES ($1, $2);", id_, data_str
            )
    finally:
        await conn.close()


async def update_json_embeddings_in_database():
    # Connect to PostgreSQL
    dsn = get_dns_edgar().replace("+asyncpg", "")

    # Connect to the database
    conn = await asyncpg.connect(dsn)
    try:
        # Fetch all records
        rows = await conn.fetch(
            "SELECT id, data, embedding FROM json_blobs order by id asc;"
        )

        for row in rows:
            id_, data, embedding = row["id"], row["data"], row["embedding"]

            if embedding:
                log.info(f"Skipping: {id_}")
                continue

            log.info(f"Processing: {id_} {data[:]}...")
            data = json.loads(data)

            isContent = False
            try:
                if isinstance(data, dict):
                    isContent = data.get("type") is not None
                if isinstance(data, list):
                    isContent = data[0].get("type") is not None

            except:
                pass
            if not isContent:
                log.info(f"Deleting row with id {id_} because isContent is False")
                return
                await conn.execute("DELETE FROM json_blobs WHERE id = $1;", id_)
                return

            text = extract_all_text(data)
            log.info(f"here.. with text: {text}")

            embedding = get_embedding(text)

            # Update the record with the computed embedding
            embedding_vector = json.dumps(embedding)

            # Now use `embedding_vector` in your SQL query
            await conn.execute(
                "UPDATE json_blobs SET embedding = $1::vector WHERE id = $2;",
                embedding_vector,
                id_,
            )

            # return

    finally:
        await conn.close()


async def main(args):
    log.info("Hello there!")
    await update_json_embeddings_in_database()
    # deleted = extract_deleted_rows_from_logs("../deleted_items.txt")
    # log.info(deleted)

    # await restore_deleted_rows(deleted)


import argparse


def parse_args():
    parser = argparse.ArgumentParser()
    return parser.parse_args()


if __name__ == "__main__":
    asyncio.run(main(parse_args()))
