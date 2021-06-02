from django.urls import path

from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('notebooks/', views.notebooks, name='notebooks'),
    path('notebooks/<notebook_id>/', views.notes, name='notebook notes'),
    path('notebooks_error/', views.notebooks_error, name='notebooks error'),
    path('notebooks/<notebook_id>/error/', views.notebook_error, name='notebook error'),
    path('notes/<note_id>/', views.note, name='note'),
    path('note/<note_id>/error/<note_name>', views.note_error, name='note error'),
    path('joplin_ressources/<ressource_path>', views.joplin_ressource, name='joplin ressource'),
    path('tags_error/', views.tags_error, name='tags error'),
    path('tags/', views.tags, name='list tags'),
]
