from django.apps import AppConfig
import time
from django.conf import settings
from .utils import start_synchronize_joplin


class JoplinviewebConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'joplin_vieweb'
    
    def __init__(self, app_name, app_module):
        AppConfig.__init__(self, app_name, app_module)
        self.sync_task_launched = False
    
    def ready(self):
        if not self.sync_task_launched:
            self.sync_task_launched = True
            start_synchronize_joplin()
