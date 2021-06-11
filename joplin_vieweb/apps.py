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
    
    # def ready(self):
        # if not self.sync_task_launched:
            # self.sync_task_launched = True
            # start_synchronize_joplin()
            # # if you're running your app, using the python manage.py runserver command on Django, your application will run twice: One time to validate your models, and the other one to run your app.
            # # You can change this passing the option --noreload to the runserver command
            # # => to test synchro, run with --noreload to avoid 2 // synchro.
