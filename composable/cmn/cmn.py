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
PSQL_DB_USER = env.str("PGUSER", "")
PSQL_DB_PASSWORD = env.str("PGPASSWORD", "")
PSQL_DB_HOST = env.str("PGHOST", "localhost")
PSQL_DB_PORT = env.int("PGPORT", 5432)
PSQL_DB_EDGAR = env.str("PGDATABASE", "edgar")

DATABASE_URL = env.str("DATABASE_URL", "")


OPENAI_API_KEY = env.str("OPENAI_API_KEY", None)


SEC_HEADERS = {
    "User-Agent": "composable.parts abuse@composable.parts",
    "Host": "data.sec.gov",
}
