from bs4 import BeautifulSoup, NavigableString
import re
import os
import logging
from types import SimpleNamespace

log = logging.getLogger(__name__)


def file_exists(file_path):
    return os.path.isfile(file_path)


def clean_text(text):
    # return text
    # print(f"clean_text: `{text}`")
    text = text.strip().replace("\n", " ").replace("\t", " ").replace("\r", " ")
    text = " ".join(text.split())
    return text


def get_elements(element):
    if not element:
        log.error(f"element is None")
        return []
    if isinstance(element, NavigableString):
        return []
    texts = []
    for child in element.children:
        if not child.name or "xbrl" in child.name or "ix" in child.name:
            continue
        # log.info(f"child: `{child.name}`")
        s = SimpleNamespace()
        if child.name == "table":
            # log.info(f"table")
            table = child
            rows = table.find_all("tr")
            table_text = ""
            for row in rows:
                cols = row.find_all("td")
                row_text = ""
                cols = [
                    clean_text(col.text)
                    for col in cols
                    if col.text.strip() not in ["", "$"]
                ]
                if len("".join(cols)):
                    row_text = " | ".join(cols)
                if row_text:
                    table_text += row_text + " "  # add a newline after each row
            s.text = f"{table_text}\n"
            s.type = "table"
            # print(f"s type: `{s.type}` text: `{s.text}`")
            texts.append(s)
        elif child.name == "span":
            s.text = f"{clean_text(child.text)}"
            # log.info(f"span: `{s.text}`")
            s.type = "span"
            style = child.get("style", "")
            style_elements = style.split(";")

            weight = None
            italics = None

            for element in style_elements:
                if "font-weight" in element:
                    font_weight_value = element.split("font-weight:")[1].strip().lower()

                    if font_weight_value == "normal":
                        weight = 400
                    elif font_weight_value == "bold":
                        weight = 700
                    else:
                        try:
                            weight = int(font_weight_value)
                        except ValueError:
                            # Handle or log invalid font-weight values
                            pass

                if "font-style" in element:
                    italics = (
                        element.split("font-style:")[1].strip().lower() == "italic"
                    )

            if weight is not None and weight > 400:
                s.type = "h2"
                # print(f"span style: `{style}` child: `{child}`")
                if italics:
                    s.type = "h3"
            elif italics:
                s.type = "h4"

                # print(f"s type: `{s.type}` text: `{s.text}` weight: `{weight}`")
            texts.append(s)
            # log.info(f"adding span")
        else:
            texts.extend(get_elements(child))
    return texts


def get_sections(file_path, break_on_h3=True, break_on_h4=False):
    if not file_path:
        raise ValueError("file_path is required")
    if not "htm" in file_path:
        file_path = f"docs/filings/{file_path}.htm"
    log.info(f"Reading {file_path}")

    with open(file_path, "rb") as f:
        html = f.read().decode("ISO-8859-1")

    # Parse HTML using BeautifulSoup
    soup = BeautifulSoup(html, "html.parser")

    body = soup.find("body")
    if not body:
        log.warning("No body found, using div")
        body = soup.find("div")

    sections = get_elements(body)

    start = False

    part = ""
    span_found = False

    complete_sections = []

    cnt = 0

    toc = 0

    breaks = ["h2"]
    if break_on_h3:
        breaks.append("h3")
    if break_on_h4:
        breaks.append("h4")

    def add_section(text, cnt):
        nonlocal complete_sections, start

        ## low information sections
        if len(text) <= 150:
            log.info(f"skipping low information section")
            return

        section = SimpleNamespace()
        section.text = text
        section.cnt = cnt

        complete_sections.append(section)
        if not start:
            lowered = text.lower()
            if (
                "financial" in lowered
                and "balance" in lowered
                and "sheets" in lowered
                and ("table of contents" not in lowered and "index" not in lowered)
            ) or ("part 1" in lowered):
                start = True
                # print(f"Found start")
                log.info(f"Found start: `{text}`")
                complete_sections = [section]
            elif "table of contents" in lowered or "index" in lowered:
                start = True
                log.info(f"Found start: `{text}`")
                complete_sections = []

        return section

    last_section = None

    log.info(f"have {len(sections)} sections")

    for s in sections[:]:
        text = s.text
        if len(text) <= 3:
            # log.info(f"skipping short section: {text}")
            continue

        # log.info(f"s: `{s}`")

        lowered = text.lower()
        if lowered.startswith("table of contents"):
            # print(f"Found table of contents: `{text}` {toc}")
            if toc >= 2:
                log.info("skipping table of contents")
                continue

            toc += 1
        elif text.startswith(
            "The accompanying notes are an integral part of these unaudited condensed consolidated financial statements"
        ):
            continue

        # print(f"{s.type}: `{text}`")

        ## breaking on h2, maybe h3 if set
        ## h2 only leads to bigger sections, but more complete
        if s.type in breaks:
            if (
                "item 6" in lowered and "exhibits" in lowered
            ) or "signatures" in lowered:
                log.info(f"Found end: `{text}`")
                break
            if part and span_found:
                cnt += 1
                log.info(f"creating section {cnt}) {part}")
                last_section = add_section(part, cnt)

                part = f"*{text}*"
                span_found = False
            else:
                if part:
                    part = f"{part} *{text}*"
                else:
                    part = f"*{text}*"

        else:
            if not span_found:
                # use previous section if cont.
                if lowered.startswith("(cont.)") and last_section:
                    log.info(f"found cont.")
                    part = last_section.text
                    complete_sections = complete_sections[:-1]
                    text.replace("(cont.)", "")
                    if len(text) < 20:
                        continue

            span_found = True
            if part:
                part = f"{part} {text}"
            else:
                part = text

        # log.info(f"part: `{part}`")

    if part:
        add_section(part, cnt + 1)

    return complete_sections


async def main(args):
    sections = get_sections(args.filing)

    for s in sections:
        print(f"### section {s.cnt}:\n`{s.text}`")
    log.info(f"have {len(sections)} sections")


import argparse, asyncio


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--filing", "-f", help="filing document", required=True)
    parser.add_argument("--debug", "-d", action="store_true")
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    asyncio.run(main(args))
