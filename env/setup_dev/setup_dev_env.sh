#!/bin/bash -x
# This batch file create the python venv, and setup a django dev server around this "plugin".
# must be called at the root of this git repo.

if [[ ! -d env/setup_dev ]]
then
    echo "This scrip must be called at the root folder of this git repo."
    exit 1
fi

# python venv
python3 -m venv venv
. venv/bin/activate
pip install -r requirements.txt

# django dev server
django-admin startproject dev_server
patch dev_server/dev_server/settings.py < env/setup_dev/setup_dev_env_settings.patch
patch dev_server/dev_server/urls.py < env/setup_dev/setup_dev_env_urls.patch
cp env/setup_dev/.env.exemple dev_server/dev_server/.env

echo "" >> dev_server/dev_server/settings.py
echo "# Joplin variables" >> dev_server/dev_server/settings.py
echo "JOPLIN_SERVER_URL=\"http://127.0.0.1\"" >> dev_server/dev_server/settings.py
echo "JOPLIN_SERVER_PORT=41184" >> dev_server/dev_server/settings.py
echo "JOPLIN_SERVER_TOKEN=\"1234567890987654321\"" >> dev_server/dev_server/settings.py
echo "JOPLIN_LOGIN_REQUIRED=True" >> dev_server/dev_server/settings.py
echo "JOPLIN_RESSOURCES_PATH=\"/home/pi/.config/joplin/resources/\"" >> dev_server/dev_server/settings.py
echo "JOPLIN_SYNC_PERIOD_S=86400 # once a day" >> dev_server/dev_server/settings.py
echo "JOPLIN_SYNC_INFO_FILE=\"/home/pi/.config/joplin/joplin_vieweb_sync_info\"" >> dev_server/dev_server/settings.py