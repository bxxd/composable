import logging, sys
import environs

env = environs.Env()
env.read_env()

LOG_LEVEL = env.log_level("LOG_LEVEL", logging.INFO)

LOG_FORMAT = "%(asctime)s %(process)d:%(threadName)s [%(levelname)8s] %(message)s (%(filename)s:%(lineno)s)"
logging.basicConfig(stream=sys.stdout, level=LOG_LEVEL, format=LOG_FORMAT)

log = logging.getLogger(__name__)

# log.info("composable init..")

ENV = env.str("ENV", "")
PSQL_DB_USER = env.str("PSQL_DB_USER", "")
PSQL_DB_PASSWORD = env.str("PSQL_DB_PASSWORD", "")
PSQL_DB_HOST = env.str("PSQL_DB_HOST", "localhost")
PSQL_DB_PORT = env.int("PSQL_DB_PORT", 5432)
PSQL_DB_EDGAR = env.str("PSQL_DB_EDGAR", "edgar")

OPENAI_API_KEY = env.str("OPENAI_API_KEY", None)
