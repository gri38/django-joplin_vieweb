from .joplin_api import JoplinApiSync
import logging
import json
import markdown
import re
import pathlib
from django.conf import settings


class Notebook():

    
    def __init__(self):
        self.id = "NO_ID"
        self.title = "NO_TITLE"
        self.children_notebooks = []
        self.notes = []
        
    def __str__(self):
        return "{} [{}]\n    {}".format(self.title, self.id, str(self.children_notebooks))
        
    def __repr__(self):
        return self.__str__()
        
    def reprJSON(self):
    # should be on front side, but I do what I want ;-)
        return dict(name="""<a onclick="display_notebook('""" + self.id + """');">""" + self.title + "</a>", children=self.children_notebooks) 
        
        

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
        self.rootNotebook = Notebook()
        self.rootNotebook.id = ""
        self.rootNotebook.title = "ROOT NOTEBOOK"
        self.parse_notebooks()
        logging.debug("Init parse result: =============\n" + str(self.rootNotebook))
        
    def parse_notebooks(self):
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
                new_notebook.title = one_folder["title"]
                notebook.children_notebooks.append(new_notebook)
                self.append_notebook(new_notebook, folders_by_parent_id)
                
    def get_notes_metadata(self, notebook_id):
        # notes_detail = json.loads(self.joplin.get_folders_notes(notebook_id).text)
        # notes_detail = notes_detail["items"]
        # for one_note in notes_detail:
            # new_note_metadata = NoteMetadata()
            # new_note_metadata.id = one_note["id"]
            # new_note_metadata.name = one_note["title"]
            # print(new_note_metadata)
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
        
    def get_note_body(self, note_id):
        note_body = json.loads(self.joplin.get_note(note_id).text)
        note_body = note_body["body"]
        
        # change links to images:
        found = re.findall("\!\[([^]]+)\]\(:/([^)]+)\)", note_body)

        for ext, name in found:
            file_extension = pathlib.Path(ext).suffix
            note_body = note_body.replace(name, name + file_extension)

        note_body = note_body.replace("](:/", "](/joplin/joplin_ressources/")

        return note_body
        
    def get_note_html(self, note_id):
        md_text = '[TOC]\n' + self.get_note_body(note_id)
        html = markdown.markdown(md_text, extensions=['fenced_code', 'codehilite', 'toc'])
        
        return html
        
    def get_tags(self):
        logging.debug("==== Tags ====")
        self.joplin
        tags = []
        all_tags = json.loads(self.joplin.get_tags().text)
        all_tags = all_tags["items"]
        for one_tag in all_tags:
            new_tag_metadata = NoteMetadata()
            new_tag_metadata.id = one_tag["id"]
            new_tag_metadata.name = one_tag["title"]
            tags.append(new_tag_metadata)
        logging.debug(tags)
        return tags       


if __name__ == "__main__":
    nb1 = Notebook()
    nb1.id="id1"
    nb1.title="tite1"
    nb2 = Notebook()
    nb2.id="id2"
    nb2.title="tite2"
    nb1.children_notebooks.append(nb2)
   
    print(json.dumps([nb1], cls=ReprJsonEncoder, indent=4))