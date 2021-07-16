from django.urls import path
from .utils import start_synchronize_joplin
from . import views

app_name = 'joplin'

urlpatterns = [
    path('', views.index, name='index'),
    path('notebooks/', views.notebooks, name='notebooks'),
    path('notebooks/<notebook_id>/', views.notes, name='notebook notes'),
    path('notebooks_error/', views.notebooks_error, name='notebooks error'),
    path('notebooks/<notebook_id>/error/', views.notebook_error, name='notebook error'),
    path('notes/<note_id>/', views.note, name='note'),
    path('notes/<note_id>/format-<str:format>', views.note, name='note'),
    path('notes/public/<note_id>/', views.public_note, name='public note'),
    path('notes/public/data/<note_id>/', views.public_note_data, name='public note data'),
    path('notes/<note_id>/tags', views.note_tags, name='note'),
    path('notes/<note_id>/checkboxes', views.note_checkboxes, name='update note checkboxes'),
    path('note_error/', views.note_error, name='note error'),
    path('joplin_ressources/<ressource_path>', views.joplin_ressource, name='joplin_ressource'),
    path('joplin_ressources/public/<ressource_path>', views.joplin_public_ressource, name='joplin_public_ressource'),
    path('tags_error/', views.tags_error, name='tags error'),
    path('tag_error/<tag_id>', views.tag_notes_error, name='tag notes error'),
    path('tags/', views.tags, name='list tags'),
    path('tags/all', views.all_tags, name='list tags'),
    path('tags/<tag_id>/notes', views.tag_notes, name='tag notes'),
    path('sync/', views.sync_data, name='get synch data'),
    path('sync/do', views.do_sync, name='joplin synchro'),
    path('note_edit', views.note_edit, name="note_edit"),
    path('note_edit/upload', views.upload_note_attachment, name='upload note attachment')
]


# One time launched code
start_synchronize_joplin()