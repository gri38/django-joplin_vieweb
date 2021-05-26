#!/bin/bash -x
# This batch file create the python venv, and setup a django dev server around this "plugin".

# python venv
python3 -m venv venv
. venv/bin/activate
pip install -r requirements.txt

# django dev server
django-admin startproject dev_server
patch dev_server/dev_server/settings.py < setup_dev_env_settings.patch
patch dev_server/dev_server/urls.py < setup_dev_env_urls.patch

