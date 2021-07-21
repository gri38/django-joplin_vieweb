/**
 * Emit: 
 *  - "tags_changed"
 *  - "note_checkboxes_changed"
 *  - "note_edit_finished", param: dirty=true ou false (true: commit, false: cancel.)
 */
class NoteView extends EventEmitter {
    constructor(is_public=false) {
        super();
        this.is_public = is_public;
        this.set_current_note_id(null);
        this.current_note_name = null;
    }
    
    /**
     *
     */
    clear() {
        $("#note_view").removeClass("border_note");
        $("#note_view").html("");
        $("#note_view_header_left").html("");
        $("#note_view_header_right").html("");
        $("#note_header_title").html("...");
        this.set_current_note_id(null);
        this.current_note_name = null;
    }
    
    set_current_note_id(note_id) {
        this.current_note_id = note_id;
    }

    /**
     * 
     */
    reload_note_tags(note_id) {
        this.tags = new NoteTags("#note_view");
        this.tags.on("tags_changed", () => super.emit("tags_changed"));
        this.tags.on("tags_edited", () => {
            this.reload_note_tags(note_id)
            this.tags.get_note_tags(note_id);
        });
        this.tags.set_note_id(note_id);
    }
    
    /**
     *
     */
    get_note(note_id, note_name) {
        this.clear();
        this.reload_note_tags(note_id);
        display_progress($("#note_view"));
        
        $.get(
        '/joplin/notes/' + note_id + "/",
        (data) => {
                    this.set_current_note_id(note_id);
                    this.current_note_name = note_name;
                    this.tags.get_note_tags(note_id);
                    this.display_note(data, note_name);
                  }
        )  .fail(() => {
            clear_progress($("#note_view"));
            console.log("error while getting note " + note_id );
            $.get(
                '/joplin/note_error/',
                (data) => {
                        this.display_note_error(data, note_name);
                        $("#note_view").find(".icon-refresh").on("click", () => this.get_note(note_id, note_name) );
                    }
            )
      });  
    }
    
    /**
     *
     */
    display_note(data, note_name) {
        clear_progress($("#note_view"));
        $("#note_header_title").html(note_name);
        if (this.is_public == false) {
            $("#note_view_header_right").append('<span id="note_edit_delete" class="note_edit_icon icon-trash-o"></span>');
            $("#note_edit_delete").on("click", () => { this.note_delete(this.current_note_id, note_name); });
            $("#note_view_header_right").append('<span id="note_edit_edit" class="note_edit_icon icon-pencil"></span>');
            $("#note_edit_edit").on("click", () => { this.note_edit(this.current_note_id, note_name); });
        }
        $("#note_view").html(data);
        $("#note_view").addClass("border_note");
        if ($("#note_view").find(".toc").html().includes("li") == false) {
            $("#note_view").find(".toc").remove();
        }
        else {
            $("#note_view").find(".toc").append('<div class="toc_ctrl"><span id="number_btn">#</span><span id="toggle_toc_btn"  class="icon-chevron-circle-down"></span> <span onclick="$(\'.toc\').remove();" class="icon-times-circle"></span>&nbsp;</div>');
            $("#note_view").find(".toc").prepend('<center style="display: none;" id="toc_title">Content</center>');
            let note_view_position = $('#note_view').position();
            $(".toc").css("top", "calc(" + note_view_position.top.toString() + "px + 0.8em + 25px)");
            $(".toc").css("right", "20px");
            this.number_displayed = false;
            $("#number_btn").on("click", (ev) => this.toggle_number());
            $("#toggle_toc_btn").on("click", (ev) => this.toggle_toc(ev));
        }
        
        $('.toc').draggabilly({});

        if (this.is_public == false) {

            $('#note_view input[type=checkbox]').on("click", () => {
                this.handle_checkboxes();
            });
        }
    }

    /**
     * 
     */
    handle_checkboxes() {
        var dirty = false;
        $('#note_view input[type=checkbox]').each((index, el) => {
            let current_cb = $(el);
            let initiallyChecked = (current_cb.attr("checked") !== undefined);
            let currentlyChecked = current_cb.is(":checked");
            if (initiallyChecked != currentlyChecked) {
                dirty = true;
            }
        });
        
        $("#note_view_header_right .icon-check-square").remove();
        $("#note_view_header_right .icon-times-rectangle").remove();
        if (dirty) {
            // Add "publish" and "cancel" buttons.
            // let cb_ctrl_html = '<div style="display: inline; position: absolute; right: 10px;">';
            let cb_ctrl_html = '<span style="float:right; line-height: 100%; vertical-align: middle; cursor: pointer; color: #0052CC; margin-left: 5px; margin-right: 5px; /*font-size:1.2em;*/" class="icon-times-rectangle"></span>';
            cb_ctrl_html += '<span style="float:right; line-height: 100%; vertical-align: middle; cursor: pointer; color: #0052CC; margin-left: 5px; /*font-size:1.2em;*/" class="icon-check-square"></span>';
            // cb_ctrl_html += '</div>';
            $("#note_view_header_right").append(cb_ctrl_html);
            $("#note_view_header_right .icon-check-square").on("click", () => this.validate_cb_edition());
            $("#note_view_header_right .icon-times-rectangle").on("click", () => this.cancel_cb_edition());
        }
    }

    /**
     * 
     */
    validate_cb_edition() {
        let checkboxes = [];
        $('#note_view input[type=checkbox]').each((index, el) => {
            if ($(el).is(":checked")) {
                checkboxes.push(1);
            }
            else {
                checkboxes.push(0);
            }
        });
        let note_id = this.current_note_id;
        let note_name = this.current_note_name;
        this.clear();
        display_progress($("#note_view"));
        $.ajax({
            url: '/joplin/notes/' + note_id + "/checkboxes",
            type: 'post',
            data: JSON.stringify({ "cb": checkboxes }),
            headers: { "X-CSRFToken": csrftoken },
            complete: () => {
                this.get_note(note_id, note_name);
                super.emit("note_checkboxes_changed");
            }
        });
    }

    /**
     * 
     */
    cancel_cb_edition() {
        $('#note_view input[type=checkbox]').each((index, el) => {
            let current_cb = $(el);
            let initiallyChecked = (current_cb.attr("checked") !== undefined);
            current_cb.prop("checked", initiallyChecked);
        });
        this.handle_checkboxes();
    }

    
    /**
     *
     */
    toggle_number() {
        if (this.number_displayed) {
            remove_css_file(number_header_css_path);
        }
        else {
            load_css_file(number_header_css_path);
        }
        this.number_displayed = !this.number_displayed;
    }
    
    /**
     *
     */
    display_note_error(data, note_name) {
        clear_progress($("#note_view"));
        $("#note_header_title").html(note_name);
        $("#note_view").html(data);
        $("#note_view").addClass("border_note");
    }
    

    /**
     *
     */
    toggle_toc(ev) {
        $(ev.currentTarget).toggleClass("icon-chevron-circle-down");
        $(ev.currentTarget).toggleClass("icon-chevron-circle-right");
        
        let state = $("#toc_title").css("display");
        if (state == "none") {
            $(".toc>ul").fadeToggle(function() {$("#toc_title").fadeToggle();});
        }
        else {
            $("#toc_title").fadeToggle(function() {$(".toc>ul").fadeToggle();});
        }
    }

    /**
     *
     */
    note_edit(note_id, note_name) {
        this.clear();
        display_progress($("#note_view"));

        let md = "";
        var session_id = "";

        $.when(
            // get the note markdown
            $.get("/joplin/notes/" + note_id + "/format-md", (data) => { md = data; }),
            
            // create an edit session and get the id
            $.ajax({
                url: '/joplin/edit_session/',
                type: 'post',
                headers: { "X-CSRFToken": csrftoken },
                complete: (data) => { session_id = data.responseText; }
            })
        ).then(() => {
            let note_editor = new NoteEditor(note_id, note_name, session_id);
            note_editor.init(md);
            note_editor.on("cancel", () => {
                super.emit("note_edit_finished", false);
                //this.get_note(note_id, note_name);
            });
            note_editor.on("commit", () => {
                super.emit("note_edit_finished", true);
                //this.get_note(note_id, note_name);
            });
            }
        );
    }

    /**
     * 
     */
    note_delete(note_id, note_name) {
        if (confirm("Delete note [" + note_name + "] ?")) {
            $.ajax({
                url: '/joplin/notes/' + note_id + "/delete",
                type: 'post',
                headers: { "X-CSRFToken": csrftoken },
                complete: () => { super.emit("note_edit_finished", true); }
            })
        }
    }

}



