#!/bin/sh -x

django-admin startproject server .
rm ./server/settings.py
rm ./server/urls.py
cp ./settings/urls_production.py ./server/urls.py
if [ ! -e /root/.config/joplin-vieweb/settings.py ]
then
    cp ./settings/production.py /root/.config/joplin-vieweb/settings.py
    secret_key=$(python -c "from django.core.management.utils import get_random_secret_key;print(get_random_secret_key())")
    sed -i "s/secret_key_placeholder/$secret_key/" /root/.config/joplin-vieweb/settings.py
fi
ln -s /root/.config/joplin-vieweb/settings.py ./settings/settings.py
export DJANGO_SETTINGS_MODULE=settings.settings
python manage.py collectstatic --noinput
python manage.py migrate
python manage.py initadmin
nginx -g 'daemon on;'
daphne -p 8001 server.asgi:application
