from django.shortcuts import render
from django.http import HttpResponse
from django.contrib.auth.decorators import login_required
from django.conf import settings
from .joplin import Joplin, ReprJsonEncoder
import logging
from django.urls import reverse
import markdown
import json
from bs4 import BeautifulSoup 
from pathlib import Path
import mimetypes
from .utils import mimetype_to_icon

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
    data = json.dumps(joplin.rootNotebook.children, default=lambda o: o.__dict__, indent=4)
    return HttpResponse(data)
    
@conditional_decorator(login_required, settings.JOPLIN_LOGIN_REQUIRED)
def notes(request, notebook_id):
    joplin = Joplin()
    notes_metadata = joplin.get_notes_metadata(notebook_id)
    return render(request, 'joplinvieweb/notes_list.html', {"notes_metadata": notes_metadata})
    
@conditional_decorator(login_required, settings.JOPLIN_LOGIN_REQUIRED)
def note(request, note_id):
    note_body = Joplin().get_note_body(note_id)
    
    # add the path to the joplin ressources in the img and attachments:
    path_to_ressources = reverse('joplin:joplin_ressource', kwargs={'ressource_path':'dontcare'}) # => /joplin/joplin_ressources/dontcare
    path_to_ressources = path_to_ressources[:-len("dontcare")]

    note_body = note_body.replace("](:/", "](" + path_to_ressources)
    note_body = note_body.replace('src=":/', 'src="' + path_to_ressources)
    
    note_body = '[TOC]\n\n' + note_body
    html = markdown.markdown(note_body, extensions=['fenced_code', 'codehilite', 'toc'])
    
    # Finally we set an attachment image to the attachments.
    # We search for <a href="/joplin/joplin_ressources">
    soup = BeautifulSoup(html)
    for link in soup.findAll('a'):
        if path_to_ressources in link.get('href'):
            mime_type_guess = mimetypes.guess_type(link.get('href'))
            img = soup.new_tag("span", **{'class':mimetype_to_icon(mime_type_guess)})
            br = soup.new_tag("br")
            link.insert(0, br)
            link.insert(0, img)
            link['class'] = link.get('class', []) + ['attachment_link']
    html = str(soup)
    
    return HttpResponse(html)
    
@conditional_decorator(login_required, settings.JOPLIN_LOGIN_REQUIRED)
def note_tags(request, note_id):
    joplin = Joplin()
    note_tags = joplin.get_note_tags(note_id)
    return render(request, 'joplinvieweb/note_tags.html', {"note_tags": note_tags})
    
    

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
def note_error(request):
    return render(request, 'joplinvieweb/note_error.html', {})

@conditional_decorator(login_required, settings.JOPLIN_LOGIN_REQUIRED)
def joplin_ressource(request, ressource_path):
    try: 
        ressources_path = settings.JOPLIN_RESSOURCES_PATH
        file_path = Path(ressources_path) / Path(ressource_path)
        mime_type_guess = mimetypes.guess_type(file_path.name)
        ressource_file = open(file_path, 'rb')
        if mime_type_guess is not None:
            response = HttpResponse(content=ressource_file, content_type=mime_type_guess[0])
        else:
            response = HttpResponse(content=ressource_file)
    except IOError:
        response = HttpResponseNotFound()

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
    notes_metadata = joplin.get_notes_metadata_from_tag(tag_id)
    return render(request, 'joplinvieweb/notes_list.html', {"notes_metadata": notes_metadata})
    