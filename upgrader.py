from subprocess import Popen, PIPE


commands = [
    'del Chrono.exe',
    'curl https://cronumax-website.s3.ap-east-1.amazonaws.com/Chrono.exe -o Chrono.exe'
]

for c in commands:
    p = Popen(c.split(), stdout=PIPE, shell=True, stdin=PIPE, stderr=PIPE)
