from django.urls import path

from . import views

app_name = 'joplin'

urlpatterns = [
    path('', views.index, name='index'),
    path('notebooks/', views.notebooks, name='notebooks'),
    path('notebooks/<notebook_id>/', views.notes, name='notebook notes'),
    path('notebooks_error/', views.notebooks_error, name='notebooks error'),
    path('notebooks/<notebook_id>/error/', views.notebook_error, name='notebook error'),
    path('notes/<note_id>/', views.note, name='note'),
    path('notes/<note_id>/tags', views.note_tags, name='note'),
    path('note_error/', views.note_error, name='note error'),
    path('joplin_ressources/<ressource_path>', views.joplin_ressource, name='joplin_ressource'),
    path('tags_error/', views.tags_error, name='tags error'),
    path('tag_error/<tag_id>', views.tag_notes_error, name='tag notes error'),
    path('tags/', views.tags, name='list tags'),
    path('tags/<tag_id>/notes', views.tag_notes, name='tag notes'),
    path('sync/', views.sync_data, name='get synch data'),
    path('sync/do', views.do_sync, name='joplin synchro'),
]
