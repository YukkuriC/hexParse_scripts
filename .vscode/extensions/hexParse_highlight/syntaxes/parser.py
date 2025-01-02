import json, yaml
from functools import partial

open = partial(open, encoding='utf-8')

REVERSE = False
if REVERSE:
    with open('HexParse.tmGrammar.json') as f:
        data = json.load(f)
    with open('HexParse.tmGrammar.yaml', 'w') as f:
        yaml.dump(data, f)
else:
    with open('HexParse.tmGrammar.yaml') as f:
        data = yaml.load(f, yaml.Loader)
    with open('HexParse.tmGrammar.json', 'w') as f:
        json.dump(data, f, separators=',:')
