from langwave.document_loaders.sec import qk_html
import logging
from langchain.chat_models import ChatOpenAI
from langchain.schema.messages import HumanMessage
from langchain.chains import create_tagging_chain
from langchain.prompts import ChatPromptTemplate

from types import SimpleNamespace

log = logging.getLogger(__name__)


def get_num_tokens(text):
    llm = ChatOpenAI()
    num_tokens = llm.get_num_tokens_from_messages([HumanMessage(content=text)])
    return num_tokens


tagging_schema = {
    "properties": {
        "title": {
            "type": "string",
            "description": "If you were to give this text a concise title, what would it be?",
        },
        "category": {
            "type": "string",
            "description": "What best concise set of words would describe the nature of the text?",
        },
        "subcategory": {
            "type": "string",
            "description": "What is another, more specific, set of words that would describe the nature of the text?",
        },
        "tags": {
            "type": "array",
            "description": "If you had to look up this text later, what tags would you use, including Named Entity Recognition (NER) tags?",
            "items": {"type": "string"},
        },
        "sentiment": {
            "type": "string",
            "description": "How would you categorize the sentiment of the financial information in the text?",
            "enum": [
                "very positive",
                "positive",
                "slightly positive",
                "neutral",
                "slightly negative",
                "negative",
                "very negative",
            ],
        },
    },
    "required": ["title", "category", "subcategory", "tags", "sentiment"],
}


async def test_ner(args):
    s = SimpleNamespace()
    s.text = """*LIQUIDITY AND CAPITAL RESOURCES* *Liquidity and Financing Arrangements* Our principal sources of liquidity are from cash and cash equivalents, cash from operations, short-term borrowings under the credit agreement and our long-term financing. In November 2014, our Board of Directors authorized a $250 million stock repurchase program (the "2014 Program"). In November 2015, our Board of Directors approved the expansion of the 2014 Program by an additional $150 million. In August 2018, our Board of Directors approved the further expansion of the existing 2014 Program by an additional $150 million. In August 2022, our Board of Directors approved the further expansion of the existing 2014 Program by an additional $500 million. As of March 31, 2023, we had repurchased 8,712,998 shares of our common stock for an aggregate purchase price of approximately $573 million under the 2014 Program. During the three months ended March 31, 2023, we repurchased 201,742 shares of our common stock under the 2014 Program. Purchases under the 2014 Program may be made either through the open market or in privately negotiated transactions. Decisions regarding the amount and the timing of purchases under the 2014 Program will be influenced by our cash on hand, our cash flows from operations, general market conditions and other factors. The 2014 Program may be discontinued by our Board of Directors at any time. On October 4, 2018, Westlake Chemical Partners LP ("Westlake Partners") and Westlake Chemical Partners GP LLC, the general partner of Westlake Partners, entered into an Equity Distribution Agreement with UBS Securities LLC, Barclays Capital Inc., Citigroup Global Markets Inc., Deutsche Bank Securities Inc., RBC Capital Markets, LLC, Merrill Lynch, Pierce, Fenner & Smith Incorporated and Wells Fargo Securities, LLC to offer and sell WLK Partners common units, from time to time, up to an aggregate offering amount of $50 million. This Equity Distribution Agreement was amended on February 28, 2020 to reference a new shelf registration and subsequent renewals thereof for utilization under this agreement. No common units have been issued under this program as of March 31, 2023. We believe that our sources of liquidity as described above are adequate to fund our normal operations and ongoing capital expenditures and turnaround activities. Funding of any potential large expansions or potential acquisitions or the redemption of debt may likely necessitate, and therefore depend on, our ability to obtain additional financing in the future. We may not be able to access additional liquidity at favorable interest rates due to volatility of the commercial credit markets."""

    llm = ChatOpenAI(temperature=0.2, verbose=False)

    chain = create_tagging_chain(tagging_schema, llm)

    x = await chain.arun(s.text)

    log.info(f"test extracted: {x}")


async def test_ner_sections(args):
    llm = ChatOpenAI(temperature=0.2, verbose=False)

    chain = create_tagging_chain(tagging_schema, llm)

    sections = qk_html.get_sections(args.filing)
    for s in sections:
        num_tokens = llm.get_num_tokens_from_messages([HumanMessage(content=s.text)])
        print(f"### section {s.cnt}:\n`{s.text}`\nnum_tokens {num_tokens}")

        x = await chain.arun(s.text)

        log.info(f"extracted: {x}")


async def test_get_filing(args):
    llm = ChatOpenAI()
    sections = qk_html.get_sections(args.filing)

    # return

    for s in sections[:]:
        num_tokens = llm.get_num_tokens_from_messages([HumanMessage(content=s.text)])
        print(f"### section {s.cnt}:\n`{s.text}`\nnum_tokens {num_tokens}")

    log.info(f"have {len(sections)} sections")


async def main(args):
    # log.info(f"Reading {args.filing}")
    # await test_get_filing(args)
    await test_ner_sections(args)


import argparse, asyncio


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--filing", "-f", help="filing document", required=False)
    parser.add_argument("--debug", "-d", action="store_true")
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    asyncio.run(main(args))
