from django.shortcuts import render
from django.http import HttpResponse
from .joplin import Joplin, ReprJsonEncoder
import logging
import json

def index(request):
    return render(request, 'joplinvieweb/index.html', dict())

def notebooks(request):
    joplin = Joplin()
    data = json.dumps(joplin.rootNotebook.children_notebooks, cls=ReprJsonEncoder, indent=4)
    return HttpResponse(data)
    
def notes(request, notebook_id):
    joplin = Joplin()
    notes_metadata = joplin.get_notes_metadata(notebook_id)
    return render(request, 'joplinvieweb/notes_list.html', {"notes_metadata": notes_metadata})
    
def note(request, note_id):
    joplin = Joplin()
    note_html = joplin.get_note_html(note_id)
    return HttpResponse(note_html)

def notebook_error(request, notebook_id):
    return render(request, 'joplinvieweb/notebook_error.html', {"notebook_id": notebook_id})
    
def note_error(request, note_id, note_name):
    return render(request, 'joplinvieweb/note_error.html', {"note_id": note_id, "note_name": note_name})
