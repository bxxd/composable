from sqlalchemy import (
    Column,
    ForeignKey,
    Integer,
    Text,
    Date,
    TIMESTAMP,
    select,
    String,
    delete,
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
filing_period_enum = ["q1", "q2", "q3", "q4", "annual"]
filing_type_enum = ["10-k", "10-q", "8-k", "20-f", "6-k", "other"]


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
    filing_period = Column(String(10))
    filing_type = Column(String(10))
    url = Column(String(255))
    created_at = Column(TIMESTAMP, server_default=func.now())


class Excerpt(Base):
    __tablename__ = "excerpts"
    id = Column(Integer, primary_key=True)
    filing_id = Column(Integer, ForeignKey("filings.id"))
    index = Column(Integer)
    title = Column(Text)
    category = Column(String(255))
    subcategory = Column(String(255))
    sentiment = Column(String(255))
    excerpt = Column(Text)
    embedding = Column(Vector(1536))
    category_embedding = Column(Vector(1536))
    created_at = Column(TIMESTAMP, server_default=func.now())


class Tag(Base):
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
    attributes_to_track = ["excerpt", "title", "category", "subcategory"]
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

    if dirty or target.category_embedding is None:
        text = f"""{target.title} {target.category} {target.subcategory if target.subcategory else ""}"""
        target.category_embedding = get_embedding(text)


@event.listens_for(Tag, "before_insert")
@event.listens_for(Tag, "before_update")
def before_insert_or_update_tag(mapper, connection, target):
    attributes_to_track = ["tag"]
    dirty = False

    for attr in attributes_to_track:
        history = get_history(target, attr)

        if history.has_changes():
            log.info(f"before_insert_or_update_page: {attr} changed")
            dirty = True

    log.info(f"before_insert_or_update_page: dirty: {dirty}")
    log.info(f"target embedding exists: {target.embedding is not None}")

    if dirty or target.embedding is None:
        text = f"""{target.tag}"""
        target.embedding = get_embedding(text)


@event.listens_for(Filing, "before_insert")
@event.listens_for(Filing, "before_update")
def before_insert_or_update_filings(mapper, connection, target):
    if target.filing_period not in filing_period_enum:
        raise ValueError(
            f"filing_period must be one of {filing_period_enum}, got {target.filing_period}"
        )
    if target.filing_type not in filing_type_enum:
        raise ValueError(
            f"filing_type must be one of {filing_type_enum}, got {target.filing_type}"
        )
    target.filing_period = (
        target.filing_period.lower() if target.filing_period else None
    )
    target.filing_type = target.filing_type.lower() if target.filing_type else None


@event.listens_for(Company, "before_insert")
@event.listens_for(Company, "before_update")
def before_insert_or_update_company(mapper, connection, target):
    target.ticker = target.ticker.lower() if target.ticker else None


class Session(AbstractSessionEdgar):
    async def get_company_by_key(
        self, ticker=None, cik=None, id=None
    ) -> Company | None:
        ticker = ticker.lower() if ticker else None
        condition = (
            Company.ticker == ticker
            if ticker
            else Company.cik == cik
            if cik
            else Company.id == id
        )
        q = select(Company).where(condition)
        result = await self.execute(q)
        item = result.first()
        if item:
            return item[0]

    async def get_filings_by_keys(
        self, company_id, filed_at=None, reporting_for=None, filing_type=None
    ) -> Filing | None:
        log.info(f"get_filings_by_keys: {company_id} {type} {filed_at} {reporting_for}")
        if not company_id:
            log.warning("need company_id to get filing")
            return None
        condition = Filing.company_id == company_id
        if reporting_for is not None:
            condition &= Filing.reporting_for == reporting_for
        if filing_type is not None:
            condition &= Filing.filing_type == filing_type
        if filed_at is not None:
            condition &= Filing.filed_at == filed_at

        q = select(Filing).where(condition).limit(10)
        result = await self.execute(q)

        items = result.all()
        # log.info(f"get_filings_by_keys: {items}")
        return items

    async def get_excerpt_by_keys(
        self, filing_id: int = None, index: int = None
    ) -> Excerpt | None:
        log.info(f"get_excerpt_by_key: {index} {filing_id}")
        if not filing_id:
            log.warning("need filing_id to get excerpt")
            return None
        if index is None:
            log.warning("need index to get excerpt")
            return None

        condition = Excerpt.filing_id == filing_id
        condition &= Excerpt.index == index

        q = select(Excerpt).where(condition)
        result = await self.execute(q)

        # log.info(f"get_excerpt_by_key: {items}")
        ## there should be only one due to the unique constraint of filing_id and index
        item = result.first()
        if item:
            return item[0]

    async def get_filing_excerpts(self, filing_id):
        log.info(f"get_filing_excerpts filing_id: {filing_id}")
        condition = Excerpt.filing_id == filing_id
        q = select(Excerpt).where(condition)
        result = await self.execute(q)
        items = result.all()
        return items

    async def set_tags(self, excerpt_id, tags):
        log.info(f"set_tag: {excerpt_id} {tags}")

        await self.execute(delete(Tag).where(Tag.excerpt_id == excerpt_id))
        await self.commit()

        for tag in tags:
            tag = tag.strip().lower()
            await self.save(Tag(excerpt_id=excerpt_id, tag=tag))

        # delete_stmt = self.delete(Tag).where(Tag.excerpt_id == excerpt_id)

        # await self.execute(delete_stmt)

        ### first get the tag if it already exists
