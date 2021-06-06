# joplin-vieweb
A simple web viewer for Joplin app  
[View on github](https://github.com/gri38/django-joplin_vieweb)

## Purpose
I'm going to use Joplin as a notes application (instead of OneNote).  
It's a long time I wanted for something like Joplin: opensource, not coupled to a web giant, and without illimited storage: storage has a price, we should pay for it.

This quick dev is to provide an **online view of my Joplin notes**.  
It's running on a "Django server", running beside a configured & running [Joplin terminal app](https://joplinapp.org/terminal/). 

## A screenshot
![joplin-vieweb-screenshot](https://user-images.githubusercontent.com/26554495/120926743-7dc47b00-c6de-11eb-94d4-3e5e12a0f7bb.png)

## Features and not(-yet?) features
### Yes it does ❤
- Protect joplin-vieweb access by login
- Display notebooks, and notes
- code syntax highlight
- Add a table of content if note contains headers
- Display tags, and notes linked.
### No it doesn't (yet?) 💔
- Sort notebooks nor notes
- Create / edit / delete notes or tags
- No specific handling for todos.
- Search for notes or tags


## Installation, configuration
1. Install [Joplin terminal](https://joplinapp.org/terminal/).  
Configure it and start it.

2.  Add "joplin_vieweb" to your INSTALLED_APPS settings.py like this:
   ```
   INSTALLED_APPS = [
       ...
       'joplin_vieweb',
       ...
   ]
   ```
3. Add some variable in your project settings.py:
   ```
   # Joplin variables
   JOPLIN_SERVER_URL="http://127.0.0.1"
   JOPLIN_SERVER_PORT=41184
   JOPLIN_SERVER_TOKEN="1234567890987654321"
   JOPLIN_LOGIN_REQUIRED=True # set to True only if you require a logged user for accessing the notes
   ```
4. If you set JOPLIN_LOGIN_REQUIRED=True
   1. ```python manage.py migrate```
   2. ```python manage.py createsuperuser```
   3. Add the 'accounts/' path in urls.py (see next point)

5. Include the joplin_vieweb URLconf in your project urls.py like this:
   ```
       path('joplin/', include('joplin_vieweb.urls')),
       path('accounts/', include('django.contrib.auth.urls')), # only if JOPLIN_LOGIN_REQUIRED=True
   ```

6. Start the development server and visit 
   http://127.0.0.1:8000/joplin

## More advanced guides
[Read here the step-by-step full install: joplin-vieweb with daphne with nginx with TLS with Let's Encrypt.](https://github.com/gri38/django-joplin_vieweb/wiki/Server-configuration)

## Why not joplin-web?
I tried for some hours to make it run. The master branch was easy to setup, but work is still in progress.  
And the full featured "vuejs" branch: I just didn't succeed to set it up (neither with node nor with docker).... probably a matter of versions with my raspberry distribution.  
➡ I decided to do my simple own product, for my simple need: view my notes online.  
Thanks for joplin-api that helped me !

## For dev: how to setup a dev server around this "package"
Execute script setup_dev_env.sh  
Then: check joplin ressource path in dev_server/dev_server/settings.py (STATICFILES_DIRS), and ALLOWED_HOSTS.  
Then:  
```
. venv/bin/activate
cd dev_server
python manage.py runserver 0:8000
```
