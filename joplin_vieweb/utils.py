from django.conf import settings
from pathlib import Path
import os
import datetime
import logging
import time
import threading
import re
from django.urls import reverse
import markdown
import subprocess

def mimetype_to_icon(mimetype):
    type2icon = {
        'image': 'file-picture',
        'audio': 'file-music',
        'video': 'file-video',
        'application/pdf': 'file-pdf',
        'application/msword': 'file-word',
        'application/vnd.ms-word': 'file-word',
        'application/vnd.oasis.opendocument.text': 'libreoffice',
        'application/vnd.openxmlformats-officedocument.wordprocessingml': 'file-word',
        'application/vnd.ms-excel': 'file-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml': 'file-excel',
        'application/vnd.oasis.opendocument.spreadsheet': 'file-excel',
        'application/vnd.ms-powerpoint': 'file-powerpoint-o',
        'application/vnd.openxmlformats-officedocument.presentationml': 'file-powerpoint-o',
        'application/vnd.oasis.opendocument.presentation': 'file-powerpoint-o',
        'text/plain': 'file-text2',
        'text/html': 'document-file-html',
        'application/json': 'file-text2',
        'application/gzip': 'file-zip',
        'application/x-zip-compressed': 'file-zip',
        'application/zip': 'file-zip',
        'application/x-gtar': 'file-zip',
        'application/x-tar': 'file-zip',
        'application/gnutar': 'file-zip',
        'application/x-compressed': 'file-zip',
        'application/x-gzip': 'file-zip',
        'multipart/x-gzip': 'file-zip',
        'application/x-bzip': 'file-zip',
        'application/x-bzip2': 'file-zip',
        'application/x-7z-compressed': 'file-zip',
        'application/rar': 'file-zip',
    }
    
    for mime_type, icon_name in type2icon.items():
        if mime_type in mimetype:
            return "icon-" + icon_name
    return 'icon-file-empty'
    
def sync_enable():
    return hasattr(settings, 'JOPLIN_SYNC_PERIOD_S')
    
def start_synchronize_joplin():
    if sync_enable():
        logging.info("Start joplin periodic synchro ({}s)".format(settings.JOPLIN_SYNC_PERIOD_S))
        # threading.Thread(target=synchronize_joplin_loop, args=(settings.JOPLIN_SYNC_PERIOD_S, settings.JOPLIN_SYNC_INFO_FILE)).start()
        # todo: synchro with joplin-terminal-xapi
    else:
        logging.info("No joplin periodic synchro")
    
    
def synchronize_joplin_loop(period_s, info_file):
    while True:
        JoplinSync.joplin_sync(info_file)
        time.sleep(period_s)
        
class JoplinSync:
    output = ""
    err = ""
    __lock = threading.Lock()

    @staticmethod
    def joplin_sync(info_file):
        return 
        logging.debug("+++++++++++++++++-> Start Joplin synchro")
        JoplinSync.output = ""
        JoplinSync.err = ""
        sync_info = Path(info_file)
        with open(sync_info, "w") as content:
            content.write("ongoing")
        process = subprocess.Popen(["joplin", "sync"], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        #process = subprocess.Popen(["python", "c:\\Users\\FRGUNI0\\temp\\joplinsync\\sync.py"], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        for line in iter(process.stdout.readline, b''):
            JoplinSync.append_output(line.decode("utf-8").rstrip())
        for line in iter(process.stderr.readline, b''):
            JoplinSync.append_err(line.decode("utf-8").rstrip())
        last_synchro = datetime.datetime.now().strftime("%d %b %Y %H:%M")
        with open(sync_info, "w") as content:
            content.write(last_synchro)
        logging.debug("------------------> Joplin synchro done")

    @staticmethod
    def append_output(line):
        with JoplinSync.__lock:
            JoplinSync.output = JoplinSync.output + "\n" + line
            logging.debug("Sync output: " + JoplinSync.output)

    @staticmethod
    def append_err(line):
        with JoplinSync.__lock:
            JoplinSync.err = JoplinSync.err + "\n" + line
            logging.debug("Sync err: " + JoplinSync.err)

    @staticmethod
    def get_output():
        with JoplinSync.__lock:
            return JoplinSync.output

    @staticmethod
    def get_err():
        with JoplinSync.__lock:
            return JoplinSync.err

    



def markdown_public_ressource(md):
    path_to_ressources = reverse('joplin:joplin_public_ressource', kwargs={
                                 'ressource_path': 'dontcare'})  # => /joplin_ressources/public/dontcare
    path_to_ressources = path_to_ressources[:-len("dontcare")]

    md = md.replace("](:/", "](" + path_to_ressources)
    md = md.replace('src=":/', 'src="' + path_to_ressources)

    return md
   
def markdown_joplin_to_vieweb(md, public):
    """
    Adapt the given md from joplin api so that joplin-vieweb access the images and attachments.
    Roughly: transform ![image.png](:/id) to ![image.png](/joplin/joplin_ressources/id)
    """
    return md
    # change links to image so they contain the name with the extension (html format)
    found = re.findall('<img src=":/([^"]+)" +alt="([^"]+)"', md)
    for name, ext in found:
        file_extension = Path(ext).suffix
        md = md.replace(name, name + file_extension)

    # add the path to the joplin ressources in the img and attachments:
    path_to_ressources = reverse('joplin:joplin_ressource', kwargs={
                                 'ressource_path': 'dontcare'})  # => /joplin/joplin_ressources/dontcare
    path_to_ressources = path_to_ressources[:-len("dontcare")]
    if public:
        path_to_ressources = path_to_ressources + "public/"

    md = md.replace("](:/", "](" + path_to_ressources)
    md = md.replace('src=":/', 'src="' + path_to_ressources)

    return md


def markdown_vieweb_to_joplin(md):
    """
    The opposite
    """
    path_to_ressources = reverse('joplin:joplin_ressource', kwargs={
                                 'ressource_path': 'dontcare'})  # => /joplin/joplin_ressources/dontcare
    path_to_ressources = path_to_ressources[:-len("dontcare")]
    md = md.replace('src="' + path_to_ressources, 'src=":/')
    md = md.replace("](" + path_to_ressources, "](:/")

    return md

def md_to_html(md, for_preview):
    html = markdown.markdown(md, extensions=[
        'fenced_code', 'codehilite', 'toc', 'markdown.extensions.tables', 'pymdownx.mark', 'pymdownx.tabbed'])
    
    # Transform [ ] and [x] to checkboxes.
    if for_preview:
        html = html.replace(
            "<li>[ ] ", '<li><input type="checkbox" onclick="return false;">')
        html = html.replace(
            "<li>[x] ", '<li><input type="checkbox" checked onclick="return false;">')
    else:
        html = html.replace("<li>[ ] ", '<li><input type="checkbox">')
        html = html.replace("<li>[x] ", '<li><input type="checkbox" checked>')

    return html


import json
api_token = ""
def get_api_token():
    global api_token
    if not api_token:
        with open("/root/.config/joplin/settings.json") as settings:
            settings_json = json.load(settings)
            api_token = settings_json["api.token"]
    return api_token