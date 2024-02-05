import openai
from openai import OpenAI
from tenacity import retry, stop_after_attempt, wait_random_exponential
import logging

log = logging.getLogger(__name__)

client = OpenAI()


@retry(wait=wait_random_exponential(min=1, max=20), stop=stop_after_attempt(6))
def get_embedding(text, engine="text-embedding-ada-002"):
    if not text:
        log.info(f"get_embedding: text is empty")
        return None
    log.info(f"get_embedding...")
    text = text.replace("\n", " ")
    result = client.embeddings.create(input=[text], model=engine).data[0].embedding
    log.info(f"got_embedding..")
    return result