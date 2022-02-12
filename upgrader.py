import logging
import getpass
from subprocess import run, DEVNULL


logging.basicConfig(filename='/Users/{0}/Chrono/logs/Chrono.log'.format(getpass.getuser()),
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

commands = [
    'del Chrono.exe',
    'curl https://cronumax-website.s3.ap-east-1.amazonaws.com/Chrono.exe -o Chrono.exe',
    'start Chrono.exe'
]

for c in commands:
    logger.info(c)
    run(c.split(), stdin=DEVNULL, stdout=DEVNULL, stderr=DEVNULL, shell=True)
