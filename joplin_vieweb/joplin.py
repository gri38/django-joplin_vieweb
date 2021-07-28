from .joplin_api import JoplinApiSync
import logging
import json
import re
import pathlib
from django.conf import settings


class Notebook():
    def __init__(self):
        self.id = "NO_ID"
        self.name = "NO_TITLE"
        self.children = []
        
    def __str__(self):
        return "{} [{}]\n    {}".format(self.name, self.id, str(self.children))
        
    def __repr__(self):
        return self.__str__() 

class ReprJsonEncoder(json.JSONEncoder):
    def default(self, obj):
        if hasattr(obj,'reprJSON'):
            return obj.reprJSON()
        else:
            return json.JSONEncoder.default(self, obj)
            
class NoteMetadata:
    def __init__(self):
        self.id = "NO_ID"
        self.name = "NO_NAME"
        
    def __str__(self):
        return "Note metadata: {} [{}]".format(self.name, self.id)

class Joplin:
    def __init__(self):
        joplin_api_conf = {
                              'JOPLIN_HOST': settings.JOPLIN_SERVER_URL,
                              'JOPLIN_WEBCLIPPER': settings.JOPLIN_SERVER_PORT,
                          }
        self.joplin = JoplinApiSync(settings.JOPLIN_SERVER_TOKEN, **joplin_api_conf)
        self.rootNotebook = None
        
    def parse_notebooks(self):
        self.rootNotebook = Notebook()
        self.rootNotebook.id = ""
        self.rootNotebook.name = "ROOT NOTEBOOK"
        
        folders = json.loads(self.joplin.get_folders().text)
        folders = folders["items"]
        folders_by_id = { folder["id"]: folder for folder in folders }
        folders_by_parent_id = dict()
        for one_folder in folders:
            parent_id = one_folder["parent_id" ]
            if parent_id in folders_by_parent_id.keys():
                folders_by_parent_id[parent_id].append(one_folder)
            else:
                folders_by_parent_id[parent_id] = [one_folder]
        logging.debug("folders_by_id = " + str(folders_by_id))
        logging.debug("folders_by_parent_id = " + str(folders_by_parent_id))
        self.append_notebook(self.rootNotebook, folders_by_parent_id)
        
    def append_notebook(self, notebook, folders_by_parent_id):
        """
        append to notebook every notebook with parent_id
        """
        if notebook.id in folders_by_parent_id.keys():
            for one_folder in folders_by_parent_id[notebook.id]:
                new_notebook = Notebook()
                new_notebook.id = one_folder["id"]
                new_notebook.name = one_folder["title"]
                notebook.children.append(new_notebook)
                self.append_notebook(new_notebook, folders_by_parent_id)

    def create_notebook(self, parent_id, title):
        new_notebook_details = json.loads(
            self.joplin.create_folder(title, **{"parent_id": parent_id}).text)
        new_notebook_id = new_notebook_details["id"]
        return new_notebook_id

    def delete_notebook(self, notebook_id):
        res = self.joplin.delete_folder(notebook_id)
        logging.debug(
            "delete_notebook [{}] result: [{}]".format(notebook_id, res))
                
    def get_notes_metadata(self, notebook_id):
        notes_metadata = []
        notes_detail = json.loads(self.joplin.get_notes_preview().text)
        notes_detail = notes_detail["items"]
        for one_note in notes_detail:
            if one_note["parent_id"] == notebook_id:
                new_note_metadata = NoteMetadata()
                new_note_metadata.id = one_note["id"]
                new_note_metadata.name = one_note["title"]
                notes_metadata.append(new_note_metadata)
        return notes_metadata
    
    def get_notes_metadata_from_tag(self, tag_id):  
        notes_metadata = []
        notes_detail = json.loads(self.joplin.get_notes_preview().text)
        notes_detail = notes_detail["items"]
        for one_note in notes_detail:
            one_note_tags = json.loads(self.joplin.get_notes_tags(one_note["id"]).text)
            one_note_tags = one_note_tags["items"]
            try:
                next(tag for tag in one_note_tags if tag["id"] == tag_id)
                new_note_metadata = NoteMetadata()
                new_note_metadata.id = one_note["id"]
                new_note_metadata.name = one_note["title"]
                notes_metadata.append(new_note_metadata)
            except:
                pass # this note has not the target tag.
        return notes_metadata
   
        
    def get_note_body_name(self, note_id):
        note = json.loads(self.joplin.get_note(note_id).text)
        note_body = note["body"]
        note_name = note["title"]

        return (note_body, note_name)
        
    def get_note_tags(self, note_id):
        note_tags = json.loads(self.joplin.get_notes_tags(note_id).text)
        note_tags = note_tags["items"]
        tags = []
        for one_tag in note_tags:
            new_tag_metadata = NoteMetadata()
            new_tag_metadata.id = one_tag["id"]
            new_tag_metadata.name = one_tag["title"]
            tags.append(new_tag_metadata)
        return tags 

    def update_note_tags(self, note_id, tags):
        current_tags = self.get_note_tags(note_id)
        current_tags_dict = {tag.name : tag.id for tag in current_tags}
        current_tags_names = current_tags_dict.keys()

        all_tags = self.get_tags()
        all_tags_dict = {tag.name : tag.id for tag in all_tags}
        all_tags_names = all_tags_dict.keys()

        existing_tags_to_add = []
        new_tags_to_add = []
        existing_tags_to_delete = list(set(current_tags_names) - set(tags))

        for one in tags:
            if one not in current_tags_names:
                if one in all_tags_names:
                    existing_tags_to_add.append(one)
                else:
                    new_tags_to_add.append(one)

        for tag_to_delete in existing_tags_to_delete:
            self.joplin.delete_tags_notes(all_tags_dict[tag_to_delete], note_id)

        for tag_to_add in existing_tags_to_add:
            self.joplin.create_tags_notes(note_id, all_tags_dict[tag_to_add])

        for tag_to_add in new_tags_to_add:
            result = self.joplin.create_tag(tag_to_add)
            if result.status_code == 200:
                self.joplin.create_tags_notes(note_id, json.loads(result.text)["id"])

    def update_note_checkboxes(self, note_id, cb):
        note = json.loads(self.joplin.get_note(note_id).text)
        note_body = note["body"]
        note_title = note["title"]
        note_parent_id = note["parent_id"]
        cb_indexes = [m.start() for m in re.finditer("- \[[ x]\] ", note_body)]
        for checked, cb_index in zip(cb, cb_indexes):
            cb_string = "- [ ] "
            if checked == 1:
                cb_string = "- [x] "
            note_body = note_body[0:cb_index] + cb_string + \
                note_body[cb_index + len(cb_string):]
        self.joplin.update_note(note_id, note_title, note_body, note_parent_id)



    def _get_tags(self):
        """
        Get all tags
        """
        all_tags = json.loads(self.joplin.get_tags().text)
        all_tags = all_tags["items"]
        return all_tags
    
    def get_tags(self, with_notes=False):
        tags = []
        all_tags = self._get_tags()
        for one_tag in all_tags:
            add_one_tag = True
            if with_notes:
                notes_preview = json.loads(self.joplin.get_tags_notes_preview(one_tag["id"]).text)
                notes_preview = notes_preview["items"]
                if not notes_preview:
                    # if one_tag has no note, we don't add it.
                    add_one_tag = False
            if add_one_tag: 
                new_tag_metadata = NoteMetadata()
                new_tag_metadata.id = one_tag["id"]
                new_tag_metadata.name = one_tag["title"]
                tags.append(new_tag_metadata)
        return tags

    def create_resource(self, file_path, title):
        res = self.joplin.create_resource(file_path, **{"title": title})
        logging.debug("create ressource for [{}]".format(file_path))
        logging.debug("    code = [{}]".format(res.status_code))
        logging.debug("    text = [{}]".format(res.text))
        res = json.loads(res.text)
        return (res["id"], res["title"])

    def get_ressource_name(self, resource_id):
        res = json.loads(self.joplin.get_resource(resource_id).text)
        try:
            return res["title"]
        except:
            return None

    def update_note(self, note_id, title, md):
        parent_id = json.loads(self.joplin.get_note(note_id).text)["parent_id"]
        res = self.joplin.update_note(note_id, title, md, parent_id)

    def create_note(self, notebook_id, title, md):
        if not title:
            title = "Untitled"
        res = json.loads(self.joplin.create_note(title, md, notebook_id).text)
        return res["id"]


    def delete_note(self, note_id):
        self.joplin.delete_note(note_id)


if __name__ == "__main__":
    nb1 = Notebook()
    nb1.id="id1"
    nb1.name="tite1"
    nb2 = Notebook()
    nb2.id="id2"
    nb2.name="tite2"
    nb1.children.append(nb2)
   
    print(json.dumps([nb1], default=lambda o: o.__dict__, indent=4))
