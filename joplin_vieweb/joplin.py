from joppy.api import Api
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

    folders_by_parent_id = dict()


    def __init__(self):
        self.joplin = Api(
            settings.JOPLIN_SERVER_TOKEN,
            "{}:{}".format(settings.JOPLIN_SERVER_URL, settings.JOPLIN_SERVER_PORT),
        )
        self.rootNotebook = None
        
    def parse_notebooks(self):
        self.rootNotebook = Notebook()
        self.rootNotebook.id = ""
        self.rootNotebook.name = "ROOT NOTEBOOK"
        
        folders_by_id = {}

        folders = self.joplin.get_all_notebooks()
        folders_by_id = {folder["id"]: folder for folder in folders}

        Joplin.folders_by_parent_id = dict()
        for one_folder in folders:
            parent_id = one_folder["parent_id" ]
            if parent_id in Joplin.folders_by_parent_id.keys():
                Joplin.folders_by_parent_id[parent_id].append(one_folder)
            else:
                Joplin.folders_by_parent_id[parent_id] = [one_folder]
        logging.debug("folders_by_id = " + str(folders_by_id))
        logging.debug("folders_by_parent_id = " + str(Joplin.folders_by_parent_id))
        self.append_notebook(self.rootNotebook)
        
    def append_notebook(self, notebook):
        """
        append to notebook every notebook with parent_id
        """
        if notebook.id in Joplin.folders_by_parent_id.keys():
            for one_folder in Joplin.folders_by_parent_id[notebook.id]:
                new_notebook = Notebook()
                new_notebook.id = one_folder["id"]
                new_notebook.name = one_folder["title"]
                notebook.children.append(new_notebook)
                self.append_notebook(new_notebook)

    def create_notebook(self, parent_id, title):
        return self.joplin.add_notebook(title=title, parent_id=parent_id)

    def delete_notebook(self, notebook_id):
        notebook_id = self.joplin.delete_notebook(notebook_id)
        logging.debug("delete_notebook [{}]".format(notebook_id))

    def rename_notebook(self, notebook_id, title):
        self.joplin.modify_notebook(notebook_id, title=title)
        logging.debug(
            "rename_notebook [{}] / [{}]".format(notebook_id, title))

    def get_notebook_descendants(self, notebook_id):
        # return a list of notebooks ids: all notebooks that are descendents of notebook_id
        descendents = [notebook_id]
        descendents = descendents + self.__get_descendents(notebook_id)
        return descendents
        
    def __get_descendents(self, one_descendent):
        try:
            descendents = [one["id"] for one in Joplin.folders_by_parent_id[one_descendent]]
        except:
            descendents = []
        for one_descendent in descendents:
            descendents = descendents + self.__get_descendents(one_descendent)
        return descendents

    def get_notes_metadata_recursive(self, notebook_id):
        """
        Return a list of NoteMetadata for all notes which have given notebook_id as direct or indirect ancestor.
        """
        descendents = self.get_notebook_descendants(notebook_id)

        notes_metadata = []
        for one_note in self.joplin.get_all_notes():
            if one_note["parent_id"] in descendents:
                new_note_metadata = NoteMetadata()
                new_note_metadata.id = one_note["id"]
                new_note_metadata.name = one_note["title"]
                notes_metadata.append(new_note_metadata)
        return notes_metadata
                
    def get_notes_metadata(self, notebook_id):
        """
        Return a list of NoteMetadata for all notes which have given notebook_id as direct ancestor.
        """
        notes_metadata = []
        for one_note in self.joplin.get_all_notes():
            if one_note["parent_id"] == notebook_id:
                new_note_metadata = NoteMetadata()
                new_note_metadata.id = one_note["id"]
                new_note_metadata.name = one_note["title"]
                notes_metadata.append(new_note_metadata)
        return notes_metadata

    def get_note_notebook(self, note_id):
        return self.joplin.get_note(note_id)["parent_id"]

    def get_notes_metadata_from_tag(self, tag_id):  
        notes_metadata = []
        page = 1
        while page == 1 or notes_detail["has_more"]:
            notes_detail = json.loads(self.joplin.get_notes_preview(page).text)
            page = page + 1
            notes_items = notes_detail["items"]
            for one_note in notes_items:
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
        note = self.joplin.get_note(note_id, fields="body,title")
        return (note["body"], note["title"])
        
    def get_note_tags(self, note_id):
        tags = []
        for one_tag in self.joplin.get_all_tags(note_id=note_id):
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
            self.joplin.delete_tag(all_tags_dict[tag_to_delete], note_id)

        for tag_to_add in existing_tags_to_add:
            self.joplin.add_tag(tag_id=all_tags_dict[tag_to_add], note_id=note_id)

        for tag_to_add in new_tags_to_add:
            tag_id = self.joplin.add_tag(title=tag_to_add)
            self.joplin.add_tag_to_note(tag_id=tag_id, note_id=note_id)

    def update_note_checkboxes(self, note_id, cb):
        note_body = self.joplin.get_note(note_id, fields="body")["body"]
        cb_indexes = [m.start() for m in re.finditer("- \[[ x]\] ", note_body)]
        for checked, cb_index in zip(cb, cb_indexes):
            cb_string = "- [ ] "
            if checked == 1:
                cb_string = "- [x] "
            note_body = note_body[0:cb_index] + cb_string + \
                note_body[cb_index + len(cb_string):]
        self.joplin.modify_note(note_id, body=note_body)

    def _get_tags(self):
        """
        Get all tags
        """
        return self.joplin.get_all_tags()
    
    def get_tags(self, with_notes=False):
        tags = []
        all_tags = self._get_tags()
        for one_tag in all_tags:
            add_one_tag = True
            if with_notes:
                if not self.joplin.get_all_notes(tag_id=one_tag["id"]):
                    # if one_tag has no note, we don't add it.
                    add_one_tag = False
            if add_one_tag: 
                new_tag_metadata = NoteMetadata()
                new_tag_metadata.id = one_tag["id"]
                new_tag_metadata.name = one_tag["title"]
                tags.append(new_tag_metadata)
        return tags

    def create_resource(self, file_path, title):
        res_id = self.joplin.add_resource(filename=file_path, title=title)
        return (res_id, title)

    def get_ressource_name(self, resource_id):
        return self.joplin.get_resource(resource_id)["title"]

    def update_note(self, note_id, title, md):
        self.joplin.modify_note(note_id, title=title, body=md)

    def create_note(self, notebook_id, title, md):
        if not title:
            title = "Untitled"
        return self.joplin.add_note(parent_id=notebook_id, title=title, body=md)

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
