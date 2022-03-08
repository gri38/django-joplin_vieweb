import uuid
from django.conf import settings
from pathlib import Path
import logging
import shutil
import re
from .joplin import Joplin
import json
from datetime import datetime
from datetime import timedelta
import glob
import threading

class EditSession:
    __lock = threading.Lock()

    @staticmethod
    def get_path(id):
        ressources_path = settings.JOPLIN_JOPLINVIEWEB_PATH
        return Path(ressources_path) / "temporary_edit_sessions" / id

    @staticmethod
    def create_creation_file(session_id):
        session_path = EditSession.get_path(session_id)
        creation_path = session_path / "__created__"
        with open(creation_path, "w") as content:
            content.write("{}\n".format(datetime.now().strftime("%c")))
            content.write("\nFYI: This session will be deleted one week after, at the next note edit.")

    @staticmethod
    def cleanup_old_sessions():
        max_age = timedelta(days=7)
        session_path = EditSession.get_path("")
        all_sessions = glob.glob("{}/*".format(session_path))
        sessions_to_delete = []
        for one_session in all_sessions:
            created_path = Path(one_session) / "__created__"
            with open(created_path, "r") as content:
                date_line = content.readline().strip()
                created = datetime.strptime(date_line, "%c")
                age = datetime.now() - created
                if age > max_age:
                    sessions_to_delete.append(one_session)
        for one_to_delete in sessions_to_delete:
            shutil.rmtree(one_to_delete)



    @staticmethod
    def create_session():
        EditSession.cleanup_old_sessions()
        id = str(uuid.uuid4())
        session_path = EditSession.get_path(id)
        session_path.mkdir(parents=True, exist_ok=True)
        EditSession.create_creation_file(id)
        logging.debug("Session folder created: [{}]".format(session_path))
        return id

    @staticmethod
    def delete_session(id):
        session_path = EditSession.get_path(id)
        shutil.rmtree(session_path)

        logging.debug("Session folder deleted: [{}]".format(session_path))

    @staticmethod
    def get_id_name_dict(session_id):
        session_path = EditSession.get_path(session_id)
        dict_path = session_path / "___id_names.json"
        if not dict_path.exists():
            return json.loads("{}")

        with open(dict_path, "r") as id_names_mapping:
            return json.loads(id_names_mapping.read())

    @staticmethod
    def set_id_name_dict(session_id, id_name_dict):
        session_path = EditSession.get_path(session_id)
        dict_path = session_path / "___id_names.json"
        
        with open(dict_path, "w") as id_names_mapping:
            id_names_mapping.write(json.dumps(id_name_dict))
    

    @staticmethod
    def save_file(session_id, fileObj):

        file_ext = Path(fileObj.name).suffix
        session_path = EditSession.get_path(session_id)
        attachment_id = str(uuid.uuid4()) + file_ext
        session_path = EditSession.get_path(session_id)

        dest_path = session_path / attachment_id
        with open(dest_path, 'wb+') as destination:
            for chunk in fileObj.chunks():
                destination.write(chunk)

        logging.debug("file saved: [{}]".format(dest_path))

        with EditSession.__lock:
            id_name = EditSession.get_id_name_dict(session_id)
            id_name[attachment_id] = fileObj.name
            EditSession.set_id_name_dict(session_id, id_name)

        return attachment_id

    @staticmethod
    def create_ressources_and_replace_md(session_id, md):
        id_name = EditSession.get_id_name_dict(session_id)
        #
        # First, create images ressources and replace images in markdown
        #
        attachment_data = []
        attachment_regex = "\[[^]]*\]\(/joplin/edit_session_ressource/{}/([^)]+)\)".format(session_id)
        attachment_files = re.findall(attachment_regex, str(md))
        joplin = Joplin()
        session_path = EditSession.get_path(session_id)
        for one_attachment in attachment_files:
            (id, title) = joplin.create_resource(
                str(session_path / one_attachment), id_name[one_attachment])
            attachment_data.append((id, title, one_attachment))
        # let's update md for images:
        for one_id, one_title, one_attachment in attachment_data:
            pattern = "\\[[^]]*]\\(/joplin/edit_session_ressource/{}/{}\\)".format(
                re.escape(session_id), re.escape(one_attachment))
            repl = "[{}](:/{})".format(one_title, one_id)
            md = re.sub(pattern, repl, md)

        return md



#
# regeg pour retrouver les images de la session dans le markdown
#
"""
!\[\]\(/joplin/edit_session_ressource/([^/]+)/([^)]+)\)
group 1 = session id
groupe 2 = filename
"""

#
# create / delete ressources
#
"""
>>> import core_sync
>>> j = core_sync.JoplinApiSync("c0e4381fdb72159d513e0be72d14aec3b04a2ca62b2c60efcd2c365e6ff92869c439a053c57c805af913198ebabffd47f7b961aec8b4295fe508ed1533e21d20")
>>> j.create_resource("c:\\Users\\frguni0\\Pictures\\calvin.png", **{"title": "image"}) 
<Response [200 OK]>
>>> _.text
'{"id":"7478d54d39e8460897fc91e5d8001786","title":"image","mime":"image/png","filename":"","created_time":1626698107941,"updated_time":1626698107941,"user_created_time":1626698107941,"user_updated_time":1626698107941,"file_extension":"png","encryption_cipher_text":"","encryption_applied":0,"encryption_blob_encrypted":0,"size":17671,"is_shared":0,"type_":4}'
>>>

CE qu'il faut faire: récupérer l'extension du fichier, et mettre comme title: image.ext.
Du coup l'add ressource nous retourne un id et le title sera image.png
Et il faut écrire : ![image.png](:/id) (image.png = returned title)



>>> j.delete_resources("7478d54d39e8460897fc91e5d8001786") 
<Response [200 OK]>

"""
