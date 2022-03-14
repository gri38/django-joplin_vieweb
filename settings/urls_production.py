from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('joplin/', include('joplin_vieweb.urls')),
    path('admin/', admin.site.urls),
    path('accounts/', include('django.contrib.auth.urls')),
]
