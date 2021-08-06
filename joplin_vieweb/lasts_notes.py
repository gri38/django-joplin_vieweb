import threading
from django.conf import settings
from pathlib import Path
import json

class LastsNotes:
    __lock = threading.Lock()
    HISTORY_DEPTH = 10

    @staticmethod
    def get_path():
        ressources_path = settings.JOPLIN_RESSOURCES_PATH
        return Path(ressources_path).parent / "lasts_notes"

    @staticmethod
    def get_lasts_notes():
        with LastsNotes.__lock:
            lasts_path = LastsNotes.get_path()
            if not lasts_path.exists():
                return "[]"
            with open(lasts_path, "r") as lasts_notes_mapping:
                return lasts_notes_mapping.read()

    @staticmethod
    def set_last(note_id, note_name):
        lasts = json.loads(LastsNotes.get_lasts_notes())

        # remove item note_id if already present
        lasts = list(filter(lambda x: x["id"] != note_id, lasts))

        # create an new list with new item, and update ranks of followers
        new_lasts = [{"id": note_id, "title": note_name, "pinned": False, "rank": 1}]
        rank = 2
        for one in lasts:
            one["rank"] = rank
            rank = rank + 1
            new_lasts.append(one)

        # Build the list with pinned items first
        pinned_first = []
        for one in new_lasts:
            if one["pinned"]:
                pinned_first.append(one)
        for one in new_lasts:
            if not one["pinned"]:
                pinned_first.append(one)

        # only keep max depth
        new_lasts = pinned_first[0:LastsNotes.HISTORY_DEPTH]

        # write the new history in file.
        with LastsNotes.__lock:
            lasts_path = LastsNotes.get_path()
            with open(lasts_path, "w") as lasts_notes_mapping:
                lasts_notes_mapping.write(json.dumps(new_lasts))

        return new_lasts


# for test:
if __name__ == "__main__":
    settings.configure(JOPLIN_RESSOURCES_PATH="c:\\Users\\FRGUNI0\\temp\\XXX\\")
    print(LastsNotes.set_last("I11", "NNNN"))

