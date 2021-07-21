/**
 * Emit:
 *  - "cancel"
 *  - "commit"
 */
class NoteEditor extends EventEmitter {
    constructor(note_id, note_name, session_id) {
        super();
        this.note_id = note_id;
        this.note_name = note_name;
        this.session_id = session_id;
        // console.log("Note editor created for note_id: [" + note_id + "] note name: [" + note_name + "] and session id: [" + session_id + "].");
    }

    init(md) {
        md = md.replace(/\(:\//g, "(/joplin/:/");
        clear_progress($("#note_view"));
        $("#note_header_title").html('<input id="note_edit_title" type="text" value="' + this.note_name + '">');
        $("#note_view_header_right").append('<span id="note_edit_cancel" class="note_edit_icon icon-times-rectangle"></span><span id="note_edit_commit" class="note_edit_icon icon-check-square"></span>');
        $("#note_view").html('<textarea id="note_editor" name="note_editor">' + md + '</textarea>');
        this.easyMDE = new EasyMDE({
            element: $('#note_editor')[0],
            autofocus: true,
            indentWithTabs: false,
            uploadImage: true,
            imageUploadEndpoint: "note_edit/upload/" + this.session_id,
            imageCSRFToken: csrftoken,
            spellChecker: false,
            tabSize: 4,
            previewImagesInEditor: true,
            imagePathAbsolute: true,
            imageMaxSize: 1024*1024*1024*8 // 1GB
        });

        // attach to cancel and commit buttons.
        $("#note_edit_cancel").on("click", () => { super.emit("cancel"); });
        $("#note_edit_commit").on("click", () => { this.update_note(this.note_id, this.easyMDE.value()); });
    }

    update_note(note_id, md) {
        md = md.replace(/\(\/joplin\/:\//g, "(:/");
        $.ajax({
            url: '/joplin/edit_session/' + this.session_id + '/update/' + this.note_id,
            type: 'post',
            headers: { "X-CSRFToken": csrftoken },
            data: JSON.stringify({ "markdown": md, "title": $("#note_edit_title").val() }),
            complete: () => { super.emit("commit"); }
        })
    }
}