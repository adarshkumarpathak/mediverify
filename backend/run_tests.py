import subprocess
import os

env = os.environ.copy()
env['PYTHONPATH'] = '.'

with open('log.txt', 'w', encoding='utf-8') as f:
    res = subprocess.run(['pytest', 'tests/'], capture_output=True, text=True, env=env)
    f.write("STDOUT:\n")
    f.write(res.stdout)
    f.write("\nSTDERR:\n")
    f.write(res.stderr)
    print("Log written to log.txt")
