from django.urls import path

from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('notebooks/', views.notebooks, name='notebooks'),
    path('notebooks/<notebook_id>/', views.notes, name='notebook notes'),
    path('notebooks/<notebook_id>/error/', views.notebook_error, name='notebook error'),
    path('notes/<note_id>/', views.note, name='note'),
    path('note/<note_id>/error/<note_name>', views.note_error, name='note error'),
]
