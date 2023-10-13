## self correcting chain, needs memory. needs validators on the output.
## uses chat models with messages for history.
from typing import Any, Optional
import copy

from langchain.chat_models.base import BaseChatModel
from langchain.chains.llm import LLMChain
from langchain.schema import BasePromptTemplate
from langchain.callbacks.manager import Callbacks
from langwave.memory import VolatileChatMemory
from langchain.schema import BaseChatMessageHistory
from langchain.schema.output_parser import BaseOutputParser


## this could be modified to include non-chat models, but for now it's just chat models.
class ChatChain(LLMChain):
    """stores the history of the retries, will be forked from what is passed in"""
