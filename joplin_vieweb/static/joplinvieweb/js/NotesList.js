/**
 * Emits: 
 * - 'note_selected', param: [note_id, note_name]
 * - 'note_notebook_selected', param: [note_id, notebook_id]
 * - 'note_creation_request'
 */
class NotesList extends EventEmitter {
    constructor() {
        super();
        this.last_get_source = null; // will be "notebook" or "tag"
        this.last_get_source_id = 0; // will be the notebook id or the tag id.
        this.last_selected_note_id = null;

        $("#notes_list_ctn .notes_list_header  .icon-plus1").on("click", () => { super.emit("note_creation_request") });
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

    refresh_and_select_note_from_notebook(note_id, notebook_id) {
        this.last_get_source = "notebook";
        this.last_selected_note_id = note_id;
        this.last_get_source_id = notebook_id;
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


    //
    // Lasts notes stuff
    //

    /**
     * 
     */
    get_lasts_notes(at_init=false) {
        if (at_init) {
            display_progress($("#lasts_notes .progress_placeholder"));
        }
        $.getJSON(
            '/joplin/notes/lasts',
            (data) => {
                this.display_lasts_notes(data);
            }
        ).fail(() => {
            clear_progress($("#lasts_notes .progress_placeholder"));
            console.error("error while getting lasts notes");
        });
    }

    /**
     * 
     */
    display_lasts_notes(data) {
        clear_progress($("#lasts_notes .progress_placeholder"));
        $("#lasts_notes").find("*").off();

        $("#lasts_notes ul").html("");
        for (let one_note of data) {
            let icon = "icon-sticky-note-o";
            if (one_note["pinned"]) {
                icon = "icon-push_pin";
            }
            $("#lasts_notes ul").append('<li data-note-id="' + one_note["id"] + '" data-note-name="' + one_note["title"] + '"><span class="' + icon + ' lasts_notes_item_status"></span>&nbsp;&nbsp;' + one_note["title"] + '</li>');
        }

        // register to clicks
        $("#lasts_notes li").on("click", (ev) => {
            let note_id = $(ev.currentTarget).data('note-id');
            let note_name = $(ev.currentTarget).data('note-name');
            $(".note_item").removeClass("selected");
            let item_to_select = $(".note_item[data-note-id='" + note_id + "']");
            // if (item_to_select.length) {
            //     item_to_select.addClass("selected");
            // }
            $.get(
                '/joplin/notes/' + note_id + "/notebook_id",
                (notebook_id) => {
                    super.emit("note_notebook_selected", [note_id, notebook_id])
                }
            )
        });

        // register on hover (to pin)
        $("#lasts_notes li").hover((ev) => {
            let pin_icon = "icon-pin";
            let icon_class = "pin_action";
            if ($(ev.currentTarget).find(".lasts_notes_item_status").hasClass("icon-push_pin")) {
                pin_icon = "icon-pin-outline";
                icon_class = "unpin_action"
            }
            $(ev.currentTarget).prepend("<span data-note-id=\"" + $(ev.currentTarget).data('note-id') + "\" class=\"" + pin_icon + " " + icon_class + "\"></span>");
            $(ev.currentTarget).find(".pin_action").on("click", (ev2) => { this.pin_note($(ev2.currentTarget).data("note-id"), true); });
            $(ev.currentTarget).find(".unpin_action").on("click", (ev2) => { this.pin_note($(ev2.currentTarget).data("note-id"), false); });
        }, 
        (ev) => {
            $(".pin_action[data-note-id='" + $(ev.currentTarget).data('note-id') + "']").remove();
            $(".unpin_action[data-note-id='" + $(ev.currentTarget).data('note-id') + "']").remove();
            $(ev.currentTarget).find("*").off();
        })
    }

    /**
     * Call back to pin a note and refresh the lasts notes
     */
    pin_note(note_id, pin) {
        if (pin) {
            $.ajax({
                url: '/joplin/notes/' + note_id + '/pin',
                type: 'post',
                headers: { "X-CSRFToken": csrftoken },
                complete: () => { /*this.get_lasts_notes();*/ }
            });
        }
        else {
            $.ajax({
                url: '/joplin/notes/' + note_id + '/unpin',
                type: 'post',
                headers: { "X-CSRFToken": csrftoken },
                complete: () => { /*this.get_lasts_notes();*/ }
            });
        }
        
    }

    /**
     * 
     */
    hide_lasts() {
        $("#lasts_notes").hide();
    }
    
    /**
     * 
     */
    show_lasts() {
        $("#lasts_notes").show();
    }
} 
