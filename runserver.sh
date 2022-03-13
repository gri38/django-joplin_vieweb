django-admin startproject server .
rm ./server/settings.py
if [ ! -e /root/.config/joplin-vieweb/settings.py ]
then
    cp ./settings/production.py /root/.config/joplin-vieweb/settings.py
    ln -s /root/.config/joplin-vieweb/settings.py ./settings/settings.py
    secret_key=$(python -c "from django.core.management.utils import get_random_secret_key;print(get_random_secret_key())")
    sed -i "s/secret_key_placeholder/$secret_key/" ./settings/settings.py
    export DJANGO_SETTINGS_MODULE=settings.settings
fi
python manage.py collectstatic --noinput
python manage.py migrate
python manage.py initadmin
daphne -p 8001 server.asgi:application
