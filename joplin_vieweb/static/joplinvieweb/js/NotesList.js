/**
 * Emits: 
 * - 'note_selected', param: [note_id, note_name]
 */
class NotesList extends EventEmitter {
    constructor() {
        super();
    }
    
    get_from_notebook(notebook_id) {
        display_progress($("#notes_list"));
        $.get(
            '/joplin/notebooks/' + notebook_id + "/",
            (data) => { this.display_notes(data); }
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
        super.emit("note_selected", [note_id, note_name]);
    }
    
    /**
     * 
     */
    get_from_tag(tag_id) {
        display_progress($("#notes_list"));
        $.get(
        '/joplin/tags/' + tag_id + "/notes",
        (data) => { this.display_notes(data); }
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
}