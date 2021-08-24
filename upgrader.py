from time import sleep
from subprocess import run, DEVNULL


commands = [
    'del Chrono.exe',
    'curl https://cronumax-website.s3.ap-east-1.amazonaws.com/Chrono.exe -o Chrono.exe',
    'start Chrono.exe'
]

sleep(3)

for c in commands:
    run(c.split(), stdin=DEVNULL, stdout=DEVNULL, stderr=DEVNULL, shell=True)
