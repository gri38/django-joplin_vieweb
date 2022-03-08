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

# django server
django-admin startproject server .
patch server/settings.py < env/setup_dev/setup_dev_env_settings.patch
patch server/urls.py < env/setup_dev/setup_dev_env_urls.patch
cp env/setup_dev/.env.exemple server/.env

echo "" >> server/settings.py
echo "# Joplin variables" >> server/settings.py
echo "JOPLIN_SERVER_URL=\"http://127.0.0.1\"" >> server/settings.py
echo "JOPLIN_SERVER_PORT=41184" >> server/settings.py
echo "JOPLIN_LOGIN_REQUIRED=True" >> server/settings.py
echo "JOPLIN_RESSOURCES_PATH=\"/home/pi/.config/joplin/resources/\"" >> server/settings.py
echo "JOPLIN_SYNC_PERIOD_S=86400 # once a day" >> server/settings.py
echo "JOPLIN_SYNC_INFO_FILE=\"/home/pi/.config/joplin/joplin_vieweb_sync_info\"" >> server/settings.py
echo "JOPLIN_NOTES_HISTORY_DEPTH=10" >> server/settings.py
