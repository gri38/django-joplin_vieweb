class NoteEditor {
    constructor(note_id, note_name) {
        this.note_id = note_id;
        this.note_name = note_name;
    }

    init(md) {
        clear_progress($("#note_view"));
        $(".note_view_header").html('<input type="text" value="' + this.note_name + '"><span id="note_edit_icon" class="icon-check-square"></span>');
        $("#note_view").html('<textarea id="note_editor" name="note_editor">' + md + '</textarea>');
        this.easyMDE = new EasyMDE({
            element: $('#note_editor')[0],
            autofocus: true,
            indentWithTabs: false,
            uploadImage: true,
            imageUploadEndpoint: "note_edit/upload",
            imageCSRFToken: csrftoken,
            spellChecker: false,
            tabSize: 4,
            previewImagesInEditor: true,
            imagePathAbsolute: true
        });
    }
}