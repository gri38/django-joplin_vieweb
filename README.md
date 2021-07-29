# joplin-vieweb
A simple web viewer for Joplin app  
[View on github](https://github.com/gri38/django-joplin_vieweb)

## Purpose
I'm going to use Joplin as a notes application (instead of OneNote).  
It's a long time I wanted for something like Joplin: opensource, not coupled to a web giant, and without illimited storage: storage has a price, we should pay for it.

This quick dev is to provide an **online view of my Joplin notes**.  
It's running on a "Django server", running beside a configured & running [Joplin terminal app](https://joplinapp.org/terminal/). 

## A screenshot
![oplin-vieweb-screenshot](https://user-images.githubusercontent.com/26554495/121716124-f1e88f80-cadf-11eb-806b-c8b8d8c5ec03.png)


## Features and not(-yet?) features
### Yes it does ❤
- Protect joplin-vieweb access by login
- Display notebooks, and notes
  - images
  - attachments
- code syntax highlight
- Add a table of content if note contains headers
- Display tags, and notes linked.
- Joplin sync:
  - ![image](https://user-images.githubusercontent.com/26554495/121716272-1d6b7a00-cae0-11eb-9f39-d01b81d15d1f.png)
  - Background periodic joplin sync
  - Manual trigged sync, with notebooks and tag refresh
- Public link if note has ***public*** tag  
![image](https://user-images.githubusercontent.com/26554495/121775399-ac7f9d00-cb87-11eb-9f4a-2790af8b5f77.png)
- Option to number (or not) header in notes:  
![image](https://user-images.githubusercontent.com/26554495/121775425-e6e93a00-cb87-11eb-9018-80f24ac505a4.png)
- Tag edition: add / remove / create tags in notes:
![image](https://user-images.githubusercontent.com/26554495/122593861-89ad2700-d066-11eb-9cc0-bf82a0efef8e.png)
Once tags edited, a little reminder not to forget to synchronize Joplin:  
![image](https://user-images.githubusercontent.com/26554495/122594366-37203a80-d067-11eb-96c5-c3324fee376b.png)
- Checkbox list changes can be saved to notes. See [this release note](https://github.com/gri38/django-joplin_vieweb/releases/tag/v1.9).
- Note edition / deletion, with support of image paste, and image / attachment drag&drop.
![image](https://user-images.githubusercontent.com/26554495/126487101-3d6fdae0-d1ed-4929-b000-5981928a2eb6.png)


![image](https://user-images.githubusercontent.com/26554495/126596832-a15895b6-90fb-416e-849a-192dfe8b08fd.png)
- Note creation
![joplin_create_note](https://user-images.githubusercontent.com/26554495/126760127-de455fb1-76ab-4d05-9ace-44f8fe719284.gif)
- Notebook edition: create / rename / delete
![notebook_edition](https://user-images.githubusercontent.com/26554495/127444638-a059931a-32f6-4027-8921-2dc073bf7034.gif)


### No it doesn't (yet?) 💔
- Sort notebooks nor notes
- Move note or notebook from one notebook to another.
- No specific handling for todos.
- Search for notes or tags

## Installation, configuration
1. Install [Joplin terminal](https://joplinapp.org/terminal/).  
Configure it and start it.

2. Install joplin-vieweb with `pip install django-joplin-vieweb`

3. Create a django project and configure it:

4.  Add "joplin_vieweb" to your INSTALLED_APPS settings.py like this:
   ```
   INSTALLED_APPS = [
       ...
       'joplin_vieweb',
       ...
   ]
   ```
5. Add some variable in your project settings.py:
   ```
   # Joplin variables
   JOPLIN_SERVER_URL="http://127.0.0.1"
   JOPLIN_SERVER_PORT=41184
   JOPLIN_SERVER_TOKEN="1234567890987654321"
   JOPLIN_RESSOURCES_PATH="/home/pi/.config/joplin/resources/"
   JOPLIN_LOGIN_REQUIRED=True # set to True only if you require a logged user for accessing the notes
   JOPLIN_SYNC_PERIOD_S=86400 # once a day
   JOPLIN_SYNC_INFO_FILE="/home/pi/.config/joplin/joplin_vieweb_sync_info"
   ```
6. If you set JOPLIN_LOGIN_REQUIRED=True
   1. ```python manage.py migrate```
   2. ```python manage.py createsuperuser```
   3. Add the 'accounts/' path in urls.py (see next point)

7. Include the joplin_vieweb URLconf in your project urls.py like this:
   ```
       path('joplin/', include('joplin_vieweb.urls')),
       path('accounts/', include('django.contrib.auth.urls')), # only if JOPLIN_LOGIN_REQUIRED=True
   ```

8. Start the development server and visit 
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
If you choose `JOPLIN_LOGIN_REQUIRED=True`, then: :add 
```python
urlpatterns = [
    ...
    path('accounts/', include('django.contrib.auth.urls')),
]
```

Then:  
```
. venv/bin/activate
cd dev_server
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver 0:8000
```

## Thanks to azure for free domain name
[![Nom de domaine](http://www.azote.org/pub/azote_120_60_bleu.gif)](https://www.azote.org/)
