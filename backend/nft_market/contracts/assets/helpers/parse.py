# Original file: https://github.com/scale-it/algorand-builder/blob/master/examples/algobpy/parse.py
import yaml


def parse_args(args, sc_param):
    # decode external parameter and update current values.
    # (if an external paramter is passed)
    try:
        param = yaml.safe_load(args)
        for key, value in param.items():
            sc_param[key] = value
        return sc_param
    except yaml.YAMLError as exc:
        print(exc)
