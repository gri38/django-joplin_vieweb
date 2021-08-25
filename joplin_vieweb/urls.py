from django.urls import path
from .utils import start_synchronize_joplin
from . import views

app_name = 'joplin'

urlpatterns = [
    path('', views.index, name='index'),
    path('notebooks/', views.notebooks, name='notebooks'),
    path('notebooks/<notebook_id>/', views.notes, name='notebook notes'),
    path('notebooks/<notebook_id>/delete/', views.notebook_delete, name='delete notebook'),
    path('notebooks/<notebook_id>/rename/', views.notebook_rename, name='rename notebook'),
    path('notebooks_error/', views.notebooks_error, name='notebooks error'),
    path('notebooks/<notebook_id>/error/', views.notebook_error, name='notebook error'),
    path('notes/<note_id>/', views.note, name='note'),
    path('notes/<note_id>/notebook_id', views.note_notebook, name='note'),
    path('notes/<note_id>/delete', views.delete_note, name='delete note'),
    path('notes/<note_id>/format-<str:format>', views.note, name='note'),
    path('notes/public/<note_id>/', views.public_note, name='public note'),
    path('notes/public/data/<note_id>/', views.public_note_data, name='public note data'),
    path('notes/<note_id>/tags', views.note_tags, name='note'),
    path('notes/<note_id>/checkboxes', views.note_checkboxes, name='update note checkboxes'),
    path('notes/<note_id>/pin', views.pin_note, name='pin a note'),
    path('notes/<note_id>/unpin', views.unpin_note, name='pin a note'),
    path('notes/lasts', views.get_lasts_notes, name='get lasts notes'),
    path('note_error/', views.note_error, name='note error'),
    path('joplin_ressources/<ressource_path>', views.joplin_ressource, name='joplin_ressource'),
    path(':/<ressource_path>', views.joplin_ressource, name='joplin_ressource'),
    path('joplin_ressources/public/<ressource_path>', views.joplin_public_ressource, name='joplin_public_ressource'),
    path('tags_error/', views.tags_error, name='tags error'),
    path('tag_error/<tag_id>', views.tag_notes_error, name='tag notes error'),
    path('tags/', views.tags, name='list tags'),
    path('tags/all', views.all_tags, name='list tags'),
    path('tags/<tag_id>/notes', views.tag_notes, name='tag notes'),
    path('sync/', views.sync_data, name='get synch data'),
    path('sync/do', views.do_sync, name='joplin synchro'),
    path('note_edit/upload/<str:session_id>', views.upload_note_attachment, name='upload note attachment'),
    path('edit_session/', views.edit_session, name='edit_session'),
    path('edit_session/<str:session_id>/update/<str:note_id>', views.edit_session_update_note, name='edit session update note'),
    path('edit_session/<str:session_id>/create/<str:notebook_id>', views.edit_session_create_note, name='edit session create note'),
    path('edit_session_ressource/<str:session_id>/<str:file>', views.edit_session_ressource, name='get session ressource'),
]


# One time launched code
start_synchronize_joplin()
