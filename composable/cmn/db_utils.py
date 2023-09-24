from sqlalchemy.inspection import inspect
from contextlib import asynccontextmanager
from composable.cmn import cmn
from sqlalchemy.ext import asyncio as db_async
from sqlalchemy import orm
import logging

from sqlalchemy.exc import IntegrityError

log = logging.getLogger(__name__)


def get_dns_edgar(_=None):
    x = f"postgresql+asyncpg://{cmn.PSQL_DB_USER}:{cmn.PSQL_DB_PASSWORD}@{cmn.PSQL_DB_HOST}:{cmn.PSQL_DB_PORT}/{cmn.PSQL_DB_EDGAR}"
    # log.info(f"get_dns_edgar: {x}")
    return x


def default_get_dns(_):
    raise NotImplementedError("default_get_dns() not implemented")


class PrinterMixin:
    def __repr__(self):
        attr_dict = {}
        for c in inspect(self.__class__).mapper.column_attrs:
            value = getattr(self, c.key)
            if isinstance(value, str):
                value = f"`{value[:50]}`"
            if isinstance(value, list):
                value = f"[{value[:3]}]"
            attr_dict[c.key] = value
        attrs = ", ".join(f"{k}: {v}" for k, v in attr_dict.items())
        return f"{self.__class__.__name__}<{attrs}>"


class DictMixin:
    @classmethod
    def from_dict(cls, data):
        data = {
            k: v for k, v in data.items() if k in [c.key for c in inspect(cls).attrs]
        }
        return cls(**data)

    def update_from_dict(self, data):
        attrs = {c.key for c in inspect(self.__class__).attrs}
        for k, v in data.items():
            if isinstance(v, str):
                v = v.strip()
            if k in attrs:
                setattr(self, k, v)
        return self


class Base(orm.DeclarativeBase, PrinterMixin, DictMixin):
    pass


class _AbstractSession:
    get_dns = default_get_dns

    @classmethod
    async def create(cls):
        self = cls()
        self._engine = db_async.create_async_engine(self.get_dns())

        async with self._engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        self._session = orm.sessionmaker(
            self._engine, expire_on_commit=False, class_=db_async.AsyncSession
        )()

        return self

    @classmethod
    @asynccontextmanager
    async def context(cls):
        session = await cls.create()
        try:
            yield session
        finally:
            await session.close()

    async def merge(self, obj):
        return await self._session.merge(obj)

    async def add(self, obj):
        return await self._session.add(obj)

    async def delete(self, obj):
        return await self._session.delete(obj)

    async def execute(self, stmt):
        return await self._session.execute(stmt)

    async def commit(self):
        return await self._session.commit()

    async def save(self, obj):
        await self.merge(obj)
        try:
            await self.commit()
        except IntegrityError as e:
            log.critical(f"IntegrityError: {e} - unable to commit")

    async def get(self, model, primary_key):
        log.info(f"getting {model} with primary key: {primary_key}")
        return await self._session.get(model, primary_key)

    async def close(self):
        log.info("closing session")
        await self._session.close()
        await self._engine.dispose()

    async def __aenter__(self):
        log.info("entering session")
        return self

    async def __aexit__(self, exc_type, exc_value, traceback):
        log.info("exiting session")
        await self.close()


class AbstractSessionEdgar(_AbstractSession):
    get_dns = get_dns_edgar
