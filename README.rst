=============
joplin_vieweb
=============

Joplin_vieweb is a simple web viewer for your Joplin notes.
It's intended to run beside a configure & running Joplin Terminal server.

Quick start
-----------

1. Add "joplin_vieweb" to your INSTALLED_APPS setting like this::
    
    INSTALLED_APPS = [
        ...
        'joplin_vieweb',
        ...
    ]

2. Include the joplin_vieweb URLconf in your project urls.py like this::

    path('joplin/', include('joplin_vieweb.urls')),

3. Start the development server and visit http://127.0.0.1:8000/joplin
