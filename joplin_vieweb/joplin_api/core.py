# coding: utf-8
"""
    Joplin Editor API - https://joplinapp.org/api/
"""
from copy import copy
import json
import logging
import os
import re
from logging import getLogger
import urllib.parse

# external lib to use async accesses to the joplin webclipper
import httpx

__author__ = 'FoxMaSk'
__all__ = ['JoplinApi']

from httpx import Response

logging.basicConfig(format='%(asctime)s - %(levelname)s - %(message)s')
logger = getLogger("joplin_api.api")


class JoplinApi:
    # joplin webclipper service
    JOPLIN_HOST = ''
    # API token
    token = ''

    # note properties accessibles for joplin but __only__ in preview mode
    preview_note_props = 'id,title,is_todo,todo_completed,parent_id, updated_time, ' \
                         'user_updated_time,user_created_time,encryption_applied'

    # note properties accessibles for joplin
    note_props = 'id,parent_id,title, body, created_time,updated_time, is_conflict, latitude, longitude,' \
                 'altitude, author, source_url, is_todo,todo_due, todo_completed, source, source_application, order,' \
                 'application_data, user_created_time, user_updated_time, encryption_cipher_text, encryption_applied'
    # ',body_html,base_url,image_data_url,crop_rect'  # noqa

    # folder properties accessibles for joplin
    folder_props = 'id, title, created_time, updated_time, user_created_time, user_updated_time, ' \
                   'encryption_cipher_text, encryption_applied, parent_id'

    resource_props = 'id, title, mime, filename, created_time, updated_time, ' \
                     'user_created_time, user_updated_time, file_extension, encryption_cipher_text,' \
                     'encryption_applied, encryption_blob_encrypted, size'

    def __init__(self, token, **config):
        """
        :param token: string The API token grabbed from the Joplin config page
        :param config: dict for configuration
        """
        # default value if none are provided when initializing JoplinApi()
        default_host = 'http://127.0.0.1:{}'.format(config.get('JOPLIN_WEBCLIPPER', 41184))
        self.JOPLIN_HOST = config.get('JOPLIN_HOST', default_host)
        self.token = token
        self.client = httpx.AsyncClient()

    async def query(self, method, path, fields='', **payload) -> Response:
        """
        Do a query to the System API
        :param method: the kind of query to do
        :param path: endpoints url to the API eg 'notes' 'tags' 'folders'
        :param fields: fields we want to get
        :param payload: dict with all the necessary things to deal with the API
        :return json data

        :raises HTTPError when a query cannot be executed

        """
        if method not in ('get', 'post', 'put', 'delete'):
            raise ValueError('method expected: get, post, put, delete')

        endpoints = ['/notes/', '/folders/', '/tags/', '/resources/', '/ping/', '/search/']

        if not any(f"{endpoint}" in path for endpoint in endpoints):
            msg = f'request expected: notes, folders, tags, resources, search, version or ping but not {path}'
            raise ValueError(msg)

        full_path = self.JOPLIN_HOST + path
        headers = {'Content-Type': 'application/json'}
        params = {'token': self.token}
        if fields:
            params = {'token': self.token, 'fields': fields}

        res = {}
        params_no_token = copy(params)
        params_no_token['token'] = '***'
        log = f'method {method} path {full_path} params {params_no_token} payload {payload} headers {headers}'
        logger.debug(log)

        if method == 'get':
            if 'search' in path:
                full_path = self.JOPLIN_HOST + path + '?' + payload['query_string']
            res = await self.client.get(full_path, params=params)
        elif method == 'post':

            if 'resources' in path:
                props = payload['props']

                mime = 'multipart/form-data'
                if 'mime' in props:
                    mime = props['mime']

                headers = {'Content-Type': mime}

                files = {'data': (payload['filename'], open(payload['resource_file'], 'rb'), mime)}

                res = await self.client.post(self.JOPLIN_HOST + '/resources',
                                             files=files,
                                             data={'props': json.dumps({'title': props['title'],
                                                                        'filename': payload['filename']})},
                                             params=params)
            else:
                res = await self.client.post(full_path, json=payload, params=params)
        elif method == 'put':
            res = await self.client.put(full_path, data=json.dumps(payload), params=params, headers=headers)
        elif method == 'delete':
            res = await self.client.delete(full_path, params=params)
        logger.debug(f'Response of WebClipper {res}')

        res.raise_for_status()

        return res

    ##############
    # NOTES
    ##############

    async def get_note(self, note_id) -> Response:
        """
        GET /notes/:id

        get that note
        :param note_id: string
        :return: res: result of the get
        """
        path = f'/notes/{note_id}'
        return await self.query('get', path, self.note_props)

    async def get_notes_preview(self) -> Response:
        """
        GET /notes

        get the list of all the notes of the joplin profile
        WITHOUT the BODY ! (default known field are `preview_note_props` )
        :return: res: result of the get
        """
        return await self.query('get', '/notes/', self.preview_note_props)

    async def get_notes(self) -> Response:
        """
        GET /notes

        get the list of all the notes of the joplin profile
        :return: res: result of the get
        """
        return await self.query('get', '/notes/', self.note_props)

    async def get_notes_tags(self, note_id) -> Response:
        """
        GET /notes/:id/tags

        get all the tags attached to this note
        :return: res: result of the get
        """
        path = f'/notes/{note_id}/tags'
        return await self.query('get', path, self.note_props)

    async def get_notes_resources(self, note_id) -> Response:
        """
        GET /notes/:id/resources

        get all the resources of this note
        :return: res: result of the get
        """
        path = f'/notes/{note_id}/resources'
        return await self.query('get', path, self.resource_props)

    async def create_note(self, title, body, parent_id, **kwargs) -> Response:
        """
        POST /notes

        Add a new note
        :param title: string
        :param body: string
        :param parent_id: string id of the parent folder
        :param kwargs: dict of additional data (eg 'tags')
        :return: res: json result of the post
        """
        data = {
            'title': title,
            'body': body,
            'parent_id': parent_id,
            'author': kwargs.get('author', ''),
            'source_url': kwargs.get('source_url', ''),
            'tags': kwargs.get('tags', ''),
            'is_todo': kwargs.get('is_todo', '')
        }
        # an ID has been set to create a note
        if 'id' in kwargs and re.match('[a-z0-9]{32}', kwargs['id']):
            data['id'] = kwargs['id']
        # merge 2 dicts
        all_data = {**data, **kwargs}

        return await self.query('post', '/notes/', **all_data)

    async def update_note_tags(self, note_id, title, body, parent_id, **kwargs) -> Response:
        """
        PUT /notes

        Update a note + its tags
        :param note_id: string note id
        :param title: string
        :param body: string
        :param parent_id: string id of the parent folder
        :param kwargs: dict of additional data
        :return: res: json result of the put
        """
        is_todo = kwargs.get('is_todo', 0)
        data = {
            'title': title,
            'body': body,
            'parent_id': parent_id,
            'author': kwargs.get('author', ''),
            'source_url': kwargs.get('source_url', ''),
            'is_todo': is_todo,
            'tags': kwargs.get('tags', ''),
        }
        if is_todo:
            todo_due = kwargs.get('todo_due', 0)
            todo_completed = kwargs.get('todo_completed', 0)
            data['todo_due'] = todo_due
            data['todo_completed'] = todo_completed

        path = f'/notes/{note_id}'
        return await self.query('put', path, **data)

    async def update_note(self, note_id, title, body, parent_id, **kwargs) -> Response:
        """
        PUT /notes

        Update a note all alone without its tags (see `update_note_tags` for that)
        :param note_id: string note id
        :param title: string
        :param body: string
        :param parent_id: string id of the parent folder
        :param kwargs: dict of additional data
        :return: res: json result of the put
        """
        is_todo = kwargs.get('is_todo', 0)
        data = {
            'title': title,
            'body': body,
            'parent_id': parent_id,
            'author': kwargs.get('author', ''),
            'source_url': kwargs.get('source_url', ''),
            'is_todo': is_todo
        }
        if is_todo:
            todo_due = kwargs.get('todo_due', 0)
            todo_completed = kwargs.get('todo_completed', 0)
            data['todo_due'] = todo_due
            data['todo_completed'] = todo_completed

        path = f'/notes/{note_id}'
        return await self.query('put', path, **data)

    async def delete_note(self, note_id) -> Response:
        """
        DELETE /notes/:id

        Delete a note
        :param note_id: string
        :return: res: json result of the delete
        """
        path = f'/notes/{note_id}'
        return await self.query('delete', path, self.note_props)

    ##############
    # FOLDERS
    ##############

    async def get_folder(self, folder_id) -> Response:
        """
        GET /folders/:id

        get a folder
        :param folder_id: string of the folder id
        :return: res: json result of the get
        """
        path = f'/folders/{folder_id}'
        return await self.query('get', path, self.folder_props)

    async def get_folders(self) -> Response:
        """
        GET /folders

        get the list of all the folders of the joplin profile
        :return: res: json result of the get
        """
        return await self.query('get', '/folders/', self.folder_props)

    async def get_folders_notes(self, folder_id) -> Response:
        """
        GET /folders/:id/notes

        get the list of all the notes of this folder
        :param folder_id: string of the folder id
        :return: res: json result of the get
        """
        path = f'/folders/{folder_id}/notes'
        return await self.query('get', path, self.note_props)

    async def create_folder(self, folder, **kwargs) -> Response:
        """
        POST /folders

        Add a new folder
        :param folder: name of the folder
        :return: res: json result of the post
        """
        parent_id = kwargs.get('parent_id', '')
        data = {'title': folder, 'parent_id': parent_id}
        return await self.query('post', '/folders/', **data)

    async def update_folder(self, folder_id, title, **kwargs) -> Response:
        """
        PUT /folders/:id

        Edit the folder
        :param folder_id: id of the folder to update
        :param title: string name of the folder
        :return: res: json result of the put
        """
        parent_id = kwargs.get('parent_id', '')
        data = {'title': title, 'parent_id': parent_id}
        path = f'/folders/{folder_id}'
        return await self.query('put', path, **data)

    async def delete_folder(self, folder_id) -> Response:
        """
        DELETE /folders

        delete a folder
        :param folder_id: string of the folder to delete
        :return: res: json result of the delete
        """
        path = f'/folders/{folder_id}'
        return await self.query('delete', path)

    async def rename_folder(self, folder_id, folder) -> Response:
        """
        PUT /folders

        Rename the folder
        :param folder_id: id of the folder to update
        :param folder: string name of the folder
        :return: res: json result of the put
        """
        data = {'id': folder_id, 'folder': folder}
        return await self.query('put', '/folders/', **data)

    ##############
    # TAGS
    ##############

    async def get_tag(self, tag_id) -> Response:
        """
        GET /tags/:id

        get a tag
        :param tag_id: string name of the tag
        :return: res: json result of the get
        """
        path = f'/tags/{tag_id}'
        return await self.query('get', path)

    async def get_tags(self) -> Response:
        """
        GET /tags

        get the list of all the tags of the joplin profile
        :return: res: json result of the get
        """
        return await self.query('get', '/tags/')

    async def create_tag(self, title) -> Response:
        """
        POST /tags

        Add a new tag
        :param title: name of the tag
        :return: res: json result of the post
        """
        data = {'title': title}
        return await self.query('post', '/tags/', **data)

    async def update_tag(self, tag_id, title) -> Response:
        """
        PUT /tags/:id

        Edit the tag
        :param tag_id: string id of the tag to update
        :param title: string tag name
        :return: res: json result of the put
        """
        data = {'title': title}
        path = f'/tags/{tag_id}'
        return await self.query('put', path, **data)

    async def delete_tag(self, tag_id) -> Response:
        """
        DELETE /tags/:id

        delete a tag
        :param tag_id: string id of the tag to delete
        :return: res: json result of the delete
        """
        path = f'/tags/{tag_id}'
        return await self.query('delete', path)

    async def get_tags_notes_preview(self, tag_id) -> Response:
        """
        GET /tags/:id/notes

        Gets all the notes with this tag.
        :return: res: json result of the get
        """
        path = f'/tags/{tag_id}/notes'
        return await self.query('get', path, self.preview_note_props)

    async def get_tags_notes(self, tag_id) -> Response:
        """
        GET /tags/:id/notes

        Gets all the notes with this tag.
        :return: res: json result of the get
        """
        path = f'/tags/{tag_id}/notes'
        return await self.query('get', path, self.note_props)

    async def create_tags_notes(self, note_id, tag) -> Response:
        """
        POST /tags/:id/notes

        create a tag from a note
        :return: res: json result of the get
        """
        data = {'id': note_id}
        path = f'/tags/{tag}/notes'
        return await self.query('post', path, **data)

    async def delete_tags_notes(self, tag_id, note_id):
        """
        DELETE /tags/:id/notes/:note_id

        delete a tag from a given note
        :param tag_id: string id of the tag to delete from the note
        :param note_id: string id of the note from which drop the tag
        :return: res: json result of the delete
        """
        path = f'/tags/{tag_id}/notes/{note_id}'
        return await self.query('delete', path)

    ##############
    # RESOURCES
    ##############

    async def get_resource(self, resource_id):
        """
        GET /resources/:id

        get a resource
        :param resource_id: string name of the resource
        :return: res: json result of the get
        """
        path = f'/resources/{resource_id}'
        return await self.query('get', path)

    async def get_resources(self) -> Response:
        """
        GET /resources

        get the list of all the resource_id of the joplin profile
        :return: res: json result of the get
        """
        return await self.query('get', '/resources/')

    async def create_resource(self, resource_file, **props) -> Response:
        """
        POST /resources

        Add a new resource
        :param resource_file: string, name of the resource_file
        :param props: dict
        :return: res: json result of the post
        """
        if 'title' not in props:
            raise ValueError('`create_resource` requires `title` in `props` property')

        data = {
            'filename': os.path.basename(resource_file),
            'resource_file': resource_file,
            'props': props}

        return await self.query('post', '/resources/', **data)

    async def update_resources(self, resource_id, **props) -> Response:
        """
        PUT /resources/:id

        Edit a resource
        :param resource_id: string id of the tag to update
        :param props: dict
        :return: res: json result of the put
        """
        if 'title' not in props:
            raise ValueError('`create_resource` requires `title` in `props` property')

        path = f'/resources/{resource_id}'
        return await self.query('put', path, **props)

    async def download_resources(self, resource_id) -> Response:
        """
        GET /resources/:id/file

        Download a file
        :param resource_id: string id of the tag to update
        :return: res: json result of the put
        """
        path = f'/resources/{resource_id}/file'
        return await self.query('get', path)

    async def delete_resources(self, resource_id) -> Response:
        """
        DELETE /resources/:id

        delete a tag
        :param resource_id: string id of the tag to delete
        :return: res: json result of the delete
        """
        path = f'/resources/{resource_id}'
        return await self.query('delete', path)

    ####################
    # PING
    ####################
    async def ping(self) -> Response:
        """
        GET /ping

        get the status of the JoplinWebClipper service
        :return: res: json result of the request
        """
        res = await self.query('get', '/ping/')
        if res.text != 'JoplinClipperServer':
            raise ConnectionError('WebClipper unavailable. See "Tools > Webclipper options" if the service is enable')
        return res

    ####################
    # SEARCH
    ####################
    async def search(self, query, item_type='note', field_restrictions='') -> Response:
        """
        Call GET /search?query=YOUR_QUERY to search for notes.
        This end-point supports the field parameter which is recommended to use
        so that you only get the data that you need.

        The query syntax is as described in the main documentation: https://joplinapp.org/#searching

        :param query string
        :param item_type, one of 'folder', 'note', 'tag'
        :param field_restrictions  'title' or 'body'
        :return: res: json result of the request
        """
        # note oriented lookup
        search_type_allowed = ['folder', 'note', 'tag', 'note_tag', 'resource', 'note_resource', 'resource_local_state']
        # joplin properties lookup oriented
        search_type_allowed += ['setting', 'search', 'master_key', 'item_change', 'revision',
                                'migration', 'smart_filter', 'alarm']

        return_field_allowed = ['title', 'body']

        data = {'query': query}
        # if the item_type is not one of the allowed one, the fallback is "note" by default
        if item_type and item_type in search_type_allowed:
            data['type'] = item_type

        if field_restrictions in return_field_allowed:
            data['field'] = field_restrictions

        data = urllib.parse.urlencode(data)
        qs = {'query_string': data}
        res = await self.query('get', '/search/', field_restrictions, **qs)
        return res
