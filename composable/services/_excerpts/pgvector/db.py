from sqlalchemy import (
    Column,
    ForeignKey,
    Integer,
    Text,
    Date,
    Enum,
    TIMESTAMP,
    select,
    String,
)
from sqlalchemy.orm import session
from sqlalchemy.sql import func
from pgvector.sqlalchemy import Vector
from composable.cmn.db_utils import Base, AbstractSessionEdgar
from sqlalchemy import event
from datetime import datetime
from sqlalchemy.orm.attributes import get_history
import openai

from tenacity import retry, stop_after_attempt, wait_random_exponential


import logging

log = logging.getLogger(__name__)


# making these here because of slowness on introspection with the database
# https://github.com/MagicStack/asyncpg/issues/530#issuecomment-577183867
# filing_period_enum = ["q1", "q2", "q3", "q4", "annual"]
# filing_type_enum = ["10-k", "10-q", "8-k", "20-f", "6-k", "other"]


class Company(Base):
    __tablename__ = "companies"
    id = Column(Integer, primary_key=True)
    ticker = Column(Text, unique=True)
    cik = Column(Integer, unique=True)
    name = Column(Text)
    created_at = Column(TIMESTAMP, server_default=func.now())


class Filing(Base):
    __tablename__ = "filings"
    id = Column(Integer, primary_key=True)
    company_id = Column(Integer, ForeignKey("companies.id"))
    form_file = Column(String(255))
    reporting_for = Column(Date)
    filed_at = Column(Date)
    created_at = Column(TIMESTAMP, server_default=func.now())


class Excerpt(Base):
    __tablename__ = "excerpts"
    id = Column(Integer, primary_key=True)
    filing_id = Column(Integer, ForeignKey("filings.id"))
    title = Column(String(255))
    category = Column(String(255))
    sub_category = Column(String(255))
    sentiment = Column(String(255))
    excerpt = Column(Text)
    embedding = Column(Vector(1536))
    created_at = Column(TIMESTAMP, server_default=func.now())


class Tags(Base):
    __tablename__ = "tags"
    id = Column(Integer, primary_key=True)
    excerpt_id = Column(Integer, ForeignKey("excerpts.id"))
    tag = Column(String(255))
    embedding = Column(Vector(1536))
    created_at = Column(TIMESTAMP, server_default=func.now())


@retry(wait=wait_random_exponential(min=1, max=20), stop=stop_after_attempt(6))
def get_embedding(text, engine="text-embedding-ada-002"):
    if not text:
        log.info(f"get_embedding: text is empty")
        return None
    log.info(f"get_embedding: {text}")
    text = text.replace("\n", " ")
    result = openai.Embedding.create(input=[text], model=engine)
    # log.info(f"get_embedding: {result}")
    return result["data"][0]["embedding"]


@event.listens_for(Excerpt, "before_insert")
@event.listens_for(Excerpt, "before_update")
def before_insert_or_update_excerpt(mapper, connection, target):
    attributes_to_track = ["excerpt"]
    dirty = False

    for attr in attributes_to_track:
        history = get_history(target, attr)

        if history.has_changes():
            log.info(f"before_insert_or_update_page: {attr} changed")
            dirty = True

    log.info(f"before_insert_or_update_page: dirty: {dirty}")
    log.info(f"target embedding exists: {target.embedding is not None}")

    if dirty or target.embedding is None:
        text = f"""{target.excerpt}"""
        target.embedding = get_embedding(text)
