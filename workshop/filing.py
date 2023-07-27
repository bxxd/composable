from langwave.document_loaders.sec import qk_html
import logging
from langchain.chat_models import ChatOpenAI
from langchain.schema.messages import HumanMessage
from langchain.chains import create_extraction_chain
from langchain.prompts import ChatPromptTemplate

from types import SimpleNamespace

log = logging.getLogger(__name__)


def get_num_tokens(text):
    llm = ChatOpenAI()
    num_tokens = llm.get_num_tokens_from_messages([HumanMessage(content=text)])
    return num_tokens


async def test_ner(args):
    s = SimpleNamespace()
    s.text = """*Interest Rate Risk* *Interest Rate Risk* We had a cash and cash equivalents balance of $11.7 million at March 31, 2023. We do not enter into investments for trading or speculative purposes. Interest under our credit facility is payable at a base rate, which can fluctuate based on multiple facts, including rates set by the U.S. Federal Reserve (which increased its benchmark interest rate by an aggregate of 4.75 percentage points throughout 2022 and 2023, and may continue to increase interest rates in an effort to counter the persistent inflation), the supply and demand for credit and general economic conditions, plus an applicable margin. The applicable margin is currently set at 4.0%, which can be reduced to 3.5% under certain circumstances specified in our credit facility. At March 31, 2023, we had outstanding borrowings under our revolving credit facility of $84.6 million with a weighted average interest rate of 11.5%. A 1% increase or decrease in the interest rate at that time would increase or decrease our interest expense by approximately $0.8 million per year. We do not currently hedge our interest rate exposure."""

    llm = ChatOpenAI(temperature=0.2, verbose=True)

    schema = {
        "properties": {
            "category": {"type": "string"},
            "subcategory": {"type": "string"},
            "tags": {"type": "array", "items": {"type": "string"}},
        },
        "required": ["category", "subcategory", "tags"],
    }

    chain = create_extraction_chain(schema, llm)

    sections = qk_html.get_sections(args.filing)
    for s in sections:
        num_tokens = llm.get_num_tokens_from_messages([HumanMessage(content=s.text)])
        print(f"### section {s.cnt}:\n`{s.text}`\nnum_tokens {num_tokens}")

        x = await chain.arun(s.text)

        log.info(f"extracted: {x}")


def test_get_filing(args):
    llm = ChatOpenAI()
    sections = qk_html.get_sections(args.filing)
    for s in sections:
        num_tokens = llm.get_num_tokens_from_messages([HumanMessage(content=s.text)])
        print(f"### section {s.cnt}:\n`{s.text}`\nnum_tokens {num_tokens}")

    log.info(f"have {len(sections)} sections")


async def main(args):
    # log.info(f"Reading {args.filing}")
    # await test_get_filing(args)
    await test_ner(args)


import argparse, asyncio


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--filing", "-f", help="filing document", required=True)
    parser.add_argument("--debug", "-d", action="store_true")
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    asyncio.run(main(args))
