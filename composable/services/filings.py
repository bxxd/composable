import asyncio
import argparse
import yaml

from composable.cmn import utils
from composable.services._excerpts.pgvector import db
from langwave.document_loaders.sec import qk_html
from langchain.chat_models import ChatOpenAI
from langchain.chains import create_tagging_chain
from langchain.schema.messages import HumanMessage
from langchain.callbacks import get_openai_callback
from composable.services.edgar import fetch_document
from datetime import datetime

import logging

log = logging.getLogger(__name__)

MODEL = "gpt-3.5-turbo-16k"


async def save_company_from_yaml(args):
    log.info(f"save_company: {args}")
    with open(args.company, "r") as file:
        data = yaml.safe_load(file)
        await save_company(data)


async def save_company_from_cik_data(cik_data: dict):
    log.info(f"save_company: {cik_data}")
    cik = cik_data.get("cik_str")
    if not cik:
        log.error(f"save_company: cik not found")
        return
    cik = int(cik)

    data = {
        "cik": cik,
        "ticker": cik_data.get("ticker"),
        "name": cik_data.get("title"),
    }

    await save_company(data)


async def save_company(data: dict):
    log.info(f"save_company: {data}")
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


async def save_filing_from_yaml(args):
    log.info(f"save_filing: {args}")

    with open(args.filing, "r") as file:
        data = yaml.safe_load(file)
        save_filing(data)


async def save_filing(data: dict):
    log.info(f"save_filing: {data}")
    cik = data.get("cik")
    ticker = data.get("ticker")
    # Convert 'filed_at' to datetime.date if it's a string
    filed_at = data.get("filed_at")
    if isinstance(filed_at, str):
        filed_at = datetime.strptime(filed_at, "%Y-%m-%d").date()
    # Convert 'reporting_for' to datetime.date if it's a string
    reporting_for = data.get("reporting_for")
    if isinstance(reporting_for, str):
        reporting_for = datetime.strptime(reporting_for, "%Y-%m-%d").date()
    filing_type = data.get("filing_type")
    file = data.get("file")
    url = data.get("url")

    if not file or not utils.file_exists(file):
        if url:
            file = "/tmp/" + url.split("/")[-1]
            if utils.file_exists(file):
                log.info(f"save_filing: file already exists: {file}")
            else:
                content = await fetch_document(url)
                if content:
                    log.info(f"save_filing: saving file: {file}")
                    with open(file, "w") as f:
                        f.write(content)
        else:
            log.error(f"save_filing: file not found: {file} and no url provided")
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
            filing = db.Filing.from_dict(
                {
                    "filed_at": filed_at,
                    "filing_type": filing_type,
                    "reporting_for": reporting_for,
                    "url": url,
                    "file": file,
                    "company_id": company.id,
                    "model": MODEL,
                }
            )
            filing.company_id = company.id
        else:
            (filing,) = filings[0]
            log.debug(f"already have filing: {filing}")

        filing.model = MODEL

        filing = await session.merge(filing)
        await session.commit()

    if not filing:
        log.error(f"save_filing: filing not found")
        return

    log.info(f"have filing: {filing}")

    await save_filing_excerpts(filing, file, MODEL)


_TAGGING_TEMPLATE = """You are creating a rolling extract for the company. This will be used in a value proposition for investment.

Using logos, analytical rigor, calculations.

Extract the desired information from the following passage.

Maintain a concise and clear format, using shorthand and notations that only you, an LLM AI, can understand.

Include any magnitude units on monetary values. Keep monetary units in millions where applicable.

Only extract the properties mentioned in the 'information_extraction' function.

Passage:
{input}
"""


tagging_schema = {
    "properties": {
        "tags": {
            "type": "array",
            "description": "If you had to look up this passage later, what unique set of tags would you use?",
            "items": {"type": "string"},
        },
        "category": {
            "type": "string",
            "description": "What main financial category does this passage apply to?",
        },
        "subcategory": {
            "type": "string",
            "description": "Give a concise subcategory for the passage, if there is one, to distinguish this passage.",
        },
        "insight": {
            "type": "string",
            "description": "In a sentence, what is an insight of this passage?",
        },
        "analysis": {
            "type": "string",
            "description": "What would be the financial sentiment of this passage, from the perspective of an investor?",
            "enum": [
                "very positive",
                "positive",
                "mixed",
                "neutral",
                "negative",
                "very negative",
            ],
        },
        "title": {
            "type": "string",
            "description": "Give a well formatted title for this passage, so people know what they are looking at. Be concise.",
        },
    },
    "required": ["category", "subcategory", "tags", "insight", "analysis", "title"],
}


async def save_filing_excerpts(
    filing: db.Filing, file: str, model: str = "gpt-3.5-turbo-16k"
):
    sections = qk_html.get_sections(file)

    llm = ChatOpenAI(temperature=0.2, verbose=False, model=model)

    chain = create_tagging_chain(tagging_schema, llm)

    running_cost = 0.0

    async with db.Session.context() as session:
        for s in sections:
            excerpt = await session.get_excerpt_by_keys(
                filing_id=filing.id, index=s.cnt
            )
            if not excerpt:
                excerpt = db.Excerpt(index=s.cnt, filing_id=filing.id)

            s.text = s.text.replace("\n", " ")

            with get_openai_callback() as cb:
                tags = await chain.arun(s.text)
                running_cost += cb.total_cost
                log.info(
                    f"Total Cost (USD): ${cb.total_cost} tokens: {cb.total_tokens} input_tokens: {cb.prompt_tokens} output_tokens: {cb.completion_tokens}"
                )

            log.info(f"tags: {tags}")
            log.info(f"running_cost: ${running_cost}")

            excerpt.excerpt = s.text
            excerpt.title = tags.get("title")
            excerpt.category = tags.get("category")
            excerpt.subcategory = tags.get("subcategory")
            excerpt.sentiment = tags.get("analysis")
            excerpt.insight = tags.get("insight")
            excerpt.tokens = llm.get_num_tokens_from_messages(
                [HumanMessage(content=s.text)]
            )

            excerpt = await session.merge(excerpt)
            await session.commit()

            log.info(f"excerpt: {excerpt} tags: {tags}")

            tags = tags.get("tags")
            if tags and isinstance(tags, list):
                tags = set(tags)
                await session.set_tags(excerpt.id, tags)

            await session.commit()


async def main(args):
    log.debug(f"main: {args}")

    if args.debug:
        return

    if args.company:
        await save_company_from_yaml(args)

    if args.filing:
        await save_filing_from_yaml(args)


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--filing", "-f", help="Filing config yaml")
    parser.add_argument("--company", "-c", help="Company config yaml")
    parser.add_argument("--debug", "-d", action="store_true")
    parser.add_argument("--model", "-m", default="gpt-3.5-turbo-16k")
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    asyncio.run(main(args))
