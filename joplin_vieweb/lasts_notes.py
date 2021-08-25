import threading
from django.conf import settings
from pathlib import Path
import json

if __name__ == "__main__":
      settings.configure(
          JOPLIN_RESSOURCES_PATH="c:\\Users\\FRGUNI0\\temp\\XXX\\", JOPLIN_NOTES_HISTORY_DEPTH=10)

class LastsNotes:
    __lock = threading.Lock()
    HISTORY_DEPTH = settings.JOPLIN_NOTES_HISTORY_DEPTH

    @staticmethod
    def get_path():
        ressources_path = settings.JOPLIN_RESSOURCES_PATH
        return Path(ressources_path).parent / "lasts_notes"

    @staticmethod
    def read_lasts_notes():
        with LastsNotes.__lock:
            lasts_path = LastsNotes.get_path()
            if not lasts_path.exists():
                return "[]"
            with open(lasts_path, "r") as lasts_notes_mapping:
                return lasts_notes_mapping.read()

    @staticmethod
    def write_lasts_notes(lasts):
        with LastsNotes.__lock:
            lasts_path = LastsNotes.get_path()
            with open(lasts_path, "w") as lasts_notes_mapping:
                lasts_notes_mapping.write(json.dumps(lasts))

    @staticmethod
    def set_last(note_id, note_name):
        lasts = json.loads(LastsNotes.read_lasts_notes())

        # remove item note_id if already present
        target_index = -1
        target_pinned = False
        for index, one_note in enumerate(lasts):
            if one_note["id"] == note_id:
                target_index = index
                target_pinned = one_note["pinned"]
                break
        if target_index != -1:
            del lasts[target_index]

        # create an new list with new item, and update ranks of followers
        new_lasts = [{"id": note_id, "title": note_name,
                      "pinned": target_pinned, "rank": 1}]
        rank = 2
        for one in lasts:
            one["rank"] = rank
            rank = rank + 1
            new_lasts.append(one)

        new_lasts = LastsNotes.order_lasts(new_lasts)
        LastsNotes.write_lasts_notes(new_lasts)

        return new_lasts

    @staticmethod
    def order_lasts(last):
        """
        input: lasts: array of notes ({"id":, "title":, "pinned":, "rank":}) with ranks ok.
        This method order the list: pinned first.
        It also truncate to the history max depth
        Return the ordered list
        """
        # Build the list with pinned items first
        pinned_first = []
        not_pinned = []

        for one in last:
            if one["pinned"]:
                pinned_first.append(one)
        pinned_first.sort(key=lambda k: k["rank"])
        
        for one in last:
            if not one["pinned"]:
                not_pinned.append(one)
        not_pinned.sort(key=lambda k: k["rank"])
        not_pinned = not_pinned[0:LastsNotes.HISTORY_DEPTH]

        pinned_first = pinned_first + not_pinned

        # only keep max depth
        return pinned_first

    @staticmethod
    def delete_note(note_id):
        lasts = json.loads(LastsNotes.read_lasts_notes())
        # remove deleted note:
        lasts = list(filter(lambda x: x["id"] != note_id, lasts))

        new_lasts = []
        rank = 1
        for one in lasts:
            one["rank"] = rank
            rank = rank + 1
            new_lasts.append(one)

        lasts = LastsNotes.order_lasts(lasts)
        LastsNotes.write_lasts_notes(lasts)

    @staticmethod
    def delete_notes(note_ids):
        lasts = json.loads(LastsNotes.read_lasts_notes())
        # remove deleted note:
        lasts = list(filter(lambda x: x["id"] not in note_ids, lasts))

        new_lasts = []
        rank = 1
        for one in lasts:
            one["rank"] = rank
            rank = rank + 1
            new_lasts.append(one)

        lasts = LastsNotes.order_lasts(lasts)
        LastsNotes.write_lasts_notes(lasts)

    @staticmethod
    def pin_note(note_id, pin):
        lasts = json.loads(LastsNotes.read_lasts_notes())
        for one_note in lasts:
            if one_note["id"] == note_id:
                one_note["pinned"] = pin
                break

        lasts = LastsNotes.order_lasts(lasts)

        LastsNotes.write_lasts_notes(lasts)
                


# for test:
if __name__ == "__main__":
    notes = json.loads(LastsNotes.read_lasts_notes())
    for one in notes:
        print(one)

    LastsNotes.pin_note("I6", False)
    LastsNotes.pin_note("I7", False)
    print("---")
    notes = json.loads(LastsNotes.read_lasts_notes())
    for one in notes:
        print(one)

