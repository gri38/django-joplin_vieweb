/**
 * Emits: 
 * - 'note_selected', param: [note_id, note_name]
 * - 'note_creation_request'
 */
class NotesList extends EventEmitter {
    constructor() {
        super();
        this.last_get_source = null; // will be "notebook" or "tag"
        this.last_get_source_id = 0; // will be the notebook id or the tag id.
        this.last_selected_note_id = null;

        $("#notes_list_ctn .notes_list_header  .icon-plus").on("click", () => { super.emit("note_creation_request") });
    }
    
    get_from_notebook(notebook_id, last_selected_note_id=null) {
        display_progress($("#notes_list"));
        $.get(
            '/joplin/notebooks/' + notebook_id + "/",
            (data) => {
                this.last_get_source = "notebook";
                this.last_get_source_id = notebook_id;
                this.display_notes(data);
                if (last_selected_note_id != null) {
                    this.select(last_selected_note_id);
                }
            }
        ).fail(() => {
            clear_progress($("#notes_list"));
            console.log("error while getting notes of notebook " + notebook_id );
            $.get(
                '/joplin/notebooks/' + notebook_id + "/error/",
                (data) => {
                        $("#notes_list").html(data);
                        $("#notes_list").find(".icon-refresh").on("click", () => this.get_from_notebook(notebook_id) );
                    }
            )
        });
    }

    clear() {
        $("#notes_list").html("");
    }
    
    /**
     * 
     */
    display_notes(data) {
        clear_progress($("#notes_list"));
        $("#notes_list").html(data);
        
        // Attach to each item click event
        $("#notes_list").find('li').on("click", (ev) => this.note_selected(ev));
    }
    
    /**
     * 
     */
    note_selected(ev) {
        let note_id = $(ev.currentTarget).data('note-id');
        let note_name = $(ev.currentTarget).data('note-name');
        $(".note_item").removeClass("selected");
        $(ev.currentTarget).addClass("selected");
        this.last_selected_note_id = note_id;
        super.emit("note_selected", [note_id, note_name]);
    }
    
    /**
     * 
     */
    get_from_tag(tag_id, last_selected_note_id) {
        display_progress($("#notes_list"));
        $.get(
        '/joplin/tags/' + tag_id + "/notes",
        (data) => {
            this.last_get_source = "tag";
            this.last_get_source_id = tag_id;
            this.display_notes(data);
            if (last_selected_note_id != null) {
                this.select(last_selected_note_id);
            }
        }
        )  .fail(() => {
            clear_progress($("#notes_list"));
            console.log("error while getting notes of tag " + tag_id);
            $.get(
            '/joplin/tag_error/' + tag_id,
            (data) => {
                    $("#notes_list").html(data);
                    $("#notes_list").find(".icon-refresh").on("click", () => this.get_from_tag(tag_id) );
                }
            )
        });   
    }

    /**
     * Refresh the notes list, and select again the last selected note (based on its id)
     */
    refresh_and_select() {
        if (this.last_get_source == "notebook") {
            this.get_from_notebook(this.last_get_source_id, this.last_selected_note_id);
        }
        else {
            this.get_from_tag(this.last_get_source_id, this.last_selected_note_id);
        }
    }

    refresh_and_select_note(note_id) {
        this.last_selected_note_id = note_id;
        this.refresh_and_select();
    }

    /**
     * 
     */
    select(note_id) {
        $(".note_item").removeClass("selected");
        let selected_li_target = $('#notes_list li[data-note-id="' + note_id + '"]');
        if (selected_li_target.length) { // else is not an error: when note is deleted.
            selected_li_target.addClass("selected");
            super.emit("note_selected", [selected_li_target.data("note-id"), selected_li_target.data("note-name")]);
        }
    }

    /**
     * show or hide the + button to add a note.
     * @param {boolean} visible 
     */
    note_addition(visible) {
        if (visible) {
            $("#notes_list_toolbox").show(400);
        }
        else {
            $("#notes_list_toolbox").hide(400);
        }
    }
}