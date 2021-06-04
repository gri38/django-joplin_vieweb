from django.shortcuts import render
from django.http import HttpResponse
from django.contrib.auth.decorators import login_required
from django.conf import settings
from .joplin import Joplin, ReprJsonEncoder
import logging
import json

def conditional_decorator(dec, condition):
    def decorator(func):
        if not condition:
            # Return the function unchanged, not decorated.
            return func
        return dec(func)
    return decorator

@conditional_decorator(login_required, settings.JOPLIN_LOGIN_REQUIRED)
def index(request):
    return render(request, 'joplinvieweb/index.html', dict())
    
@conditional_decorator(login_required, settings.JOPLIN_LOGIN_REQUIRED)
def notebooks(request):
    joplin = Joplin()
    data = json.dumps(joplin.rootNotebook.children_notebooks, cls=ReprJsonEncoder, indent=4)
    return HttpResponse(data)
    
@conditional_decorator(login_required, settings.JOPLIN_LOGIN_REQUIRED)
def notes(request, notebook_id):
    joplin = Joplin()
    notes_metadata = joplin.get_notes_metadata(notebook_id)
    return render(request, 'joplinvieweb/notes_list.html', {"notes_metadata": notes_metadata})
    
@conditional_decorator(login_required, settings.JOPLIN_LOGIN_REQUIRED)
def note(request, note_id):
    joplin = Joplin()
    note_html = joplin.get_note_html(note_id)
    return HttpResponse(note_html)

@conditional_decorator(login_required, settings.JOPLIN_LOGIN_REQUIRED)
def notebooks_error(request):
    return render(request, 'joplinvieweb/notebooks_error.html', {})
  
@conditional_decorator(login_required, settings.JOPLIN_LOGIN_REQUIRED)
def notebook_error(request, notebook_id):
    return render(request, 'joplinvieweb/notebook_error.html', {"notebook_id": notebook_id})
  
@conditional_decorator(login_required, settings.JOPLIN_LOGIN_REQUIRED)
def tag_notes_error(request, tag_id):
    return render(request, 'joplinvieweb/tag_notes_error.html', {"tag_id": tag_id})

@conditional_decorator(login_required, settings.JOPLIN_LOGIN_REQUIRED)
def note_error(request, note_id, note_name):
    return render(request, 'joplinvieweb/note_error.html', {"note_id": note_id, "note_name": note_name})

@conditional_decorator(login_required, settings.JOPLIN_LOGIN_REQUIRED)
def joplin_ressource(request, ressource_path):
    ressource_file = open("/home/pi/.config/joplin/resources/" + ressource_path, 'rb')
    response = HttpResponse(content=ressource_file)

    return response
    
@conditional_decorator(login_required, settings.JOPLIN_LOGIN_REQUIRED)  
def tags_error(request):
    return render(request, 'joplinvieweb/tags_error.html', {})

@conditional_decorator(login_required, settings.JOPLIN_LOGIN_REQUIRED)  
def tags(request):
    joplin = Joplin()
    tags = joplin.get_tags()
    return render(request, 'joplinvieweb/tags_list.html', {"tags": tags})
    
@conditional_decorator(login_required, settings.JOPLIN_LOGIN_REQUIRED)  
def tag_notes(request, tag_id):
    joplin = Joplin()
    notes_metadata = joplin.get_notes_metadata(notebook_id)
    return render(request, 'joplinvieweb/notes_list.html', {"notes_metadata": notes_metadata})
    