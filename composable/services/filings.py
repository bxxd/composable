import asyncio
import argparse
import yaml

from composable.cmn import utils
from composable.services._excerpts.pgvector import db
from langwave.document_loaders.sec import qk_html
from langchain.chat_models import ChatOpenAI
from langchain.chains import create_tagging_chain

import logging

log = logging.getLogger(__name__)


async def save_company(args):
    log.info(f"save_company: {args}")
    with open(args.company, "r") as file:
        data = yaml.safe_load(file)
    data = utils.remove_newlines_from_dict(data)

    cik = data.get("cik")

    async with db.Session.context() as session:
        company = await session.get_company_by_key(cik=cik)

        log.debug(f"get_company_by_key: {company}")
        if not company:
            company = db.Company.from_dict(data)
        else:
            company.update_from_dict(data)

        await session.save(company)
        log.debug(f"company: {company}")


async def save_filing(args):
    log.info(f"save_filing: {args}")

    with open(args.filing, "r") as file:
        data = yaml.safe_load(file)

    cik = data.get("cik")
    ticker = data.get("ticker")
    filed_at = data.get("filed_at")
    reporting_for = data.get("reporting_for")
    filing_type = data.get("filing_type")
    file = data.get("file")

    if not file or not utils.file_exists(file):
        log.error(f"save_filing: file not found: {file}")
        return

    filing = None
    async with db.Session.context() as session:
        company = await session.get_company_by_key(cik=cik, ticker=ticker)
        if not company:
            log.critical(f"Company not found for cik: {cik} ticker: {ticker}")
            return
        filings = await session.get_filings_by_keys(
            company_id=company.id,
            filed_at=filed_at,
            reporting_for=reporting_for,
            filing_type=filing_type,
        )

        if not filings:
            log.debug(f"Creating filing for cik: {cik} ticker: {ticker}")
            filing = db.Filing.from_dict(data)
            filing.company_id = company.id
        else:
            (filing,) = filings[0]
            log.debug(f"already have filing: {filing}")

        filing = await session.merge(filing)
        await session.commit()

    if not filing:
        log.error(f"save_filing: filing not found")
        return

    log.info(f"have filing: {filing}")

    await save_filing_excerpts(filing, file)


tagging_schema = {
    "properties": {
        "title": {
            "type": "string",
            "description": "Give a well formatted concise title for this text, so people know what they are looking at!",
        },
        "category": {
            "type": "string",
            "description": "What main financial category does this text apply to?",
        },
        "subcategory": {
            "type": "string",
            "description": "Give a concise subcategory for the text, if there is one, to distinguish this text.",
        },
        "tags": {
            "type": "array",
            "description": "If you had to look up this text later, what tags would you use, including Named Entity Recognition (NER) tags?",
            "items": {"type": "string"},
        },
        "analysis": {
            "type": "string",
            "description": "What would be the financial sentiment of this text, from perspective of an investor?",
            "enum": [
                "very positive",
                "positive",
                "mixed",
                "neutral",
                "negative",
                "very negative",
            ],
        },
    },
    "required": ["title", "category", "subcategory", "tags", "analysis"],
}


async def save_filing_excerpts(filing: db.Filing, file: str):
    sections = qk_html.get_sections(file)

    llm = ChatOpenAI(temperature=0.2, verbose=False)

    chain = create_tagging_chain(tagging_schema, llm)

    async with db.Session.context() as session:
        for s in sections:
            excerpt = await session.get_excerpt_by_keys(
                filing_id=filing.id, index=s.cnt
            )
            if not excerpt:
                excerpt = db.Excerpt(index=s.cnt, filing_id=filing.id)

            tags = await chain.arun(s.text)

            log.info(f"tags: {tags}")

            excerpt.excerpt = s.text
            excerpt.title = tags.get("title")
            excerpt.category = tags.get("category")
            excerpt.subcategory = tags.get("subcategory")
            excerpt.sentiment = tags.get("analysis")

            excerpt = await session.merge(excerpt)
            await session.commit()

            log.info(f"excerpt: {excerpt} tags: {tags}")

            tags = tags.get("tags")
            if tags and isinstance(tags, list):
                await session.set_tags(excerpt.id, tags)

            await session.commit()


async def main(args):
    log.debug(f"main: {args}")

    if args.debug:
        return

    if args.company:
        await save_company(args)

    if args.filing:
        await save_filing(args)


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--filing", "-f", help="Filing config yaml")
    parser.add_argument("--company", "-c", help="Company config yaml")
    parser.add_argument("--debug", "-d", action="store_true")
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    asyncio.run(main(args))
