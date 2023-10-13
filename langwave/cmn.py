import logging, sys
import environs

env = environs.Env()
env.read_env()
from types import SimpleNamespace

LOG_LEVEL = env.log_level("LOG_LEVEL", logging.INFO)

LOG_FORMAT = "%(asctime)s %(process)d:%(threadName)s [%(levelname)8s] %(message)s (%(filename)s:%(lineno)s)"
logging.basicConfig(stream=sys.stdout, level=LOG_LEVEL, format=LOG_FORMAT)

log = logging.getLogger(__name__)


# log.info("langwave init..")
