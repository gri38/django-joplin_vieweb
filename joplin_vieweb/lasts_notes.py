import threading
from django.conf import settings
from pathlib import Path
import json

class LastsNotes:
    __lock = threading.Lock()

    @staticmethod
    def get_path():
        ressources_path = settings.JOPLIN_RESSOURCES_PATH
        return Path(ressources_path).parent / "lasts_notes"

    @staticmethod
    def get_lasts_notes():
        with LastsNotes.__lock:
            lasts_path = LastsNotes.get_path()
            if not lasts_path.exists():
                return json.dumps([
                    {
                        "id": "note1 id", 
                        "title": "note 1 title",
                        "pinned": False
                    },
                    {
                        "id": "note2 id",
                        "title": "note 2 title",
                        "pinned": True
                    }
                ])
            with open(lasts_path, "r") as lasts_notes_mapping:
                return json.loads(lasts_notes_mapping.read())
