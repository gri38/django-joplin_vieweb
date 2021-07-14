/**
 * Emit: 
 *  - "tags_changed"
 *  - "note_checkboxes_changed"
 */
class NoteView extends EventEmitter {
    constructor() {
        super();
        this.set_current_note_id(null);
        this.current_note_name = null;
    }
    
    /**
     *
     */
    clear() {
        $("#note_view").removeClass("border_note");
        $("#note_view").html("");
        $(".note_view_header").html("...");
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
        $(".note_view_header").html(note_name + '<span id="note_edit_icon" class="icon-pencil"></span>');
        $("#note_edit_icon").on("click", () => { this.note_edit(this.current_note_id); });
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

        $('#note_view input[type=checkbox]').on("click", () => {
            this.handle_checkboxes();
        })
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
        
        $(".note_view_header .icon-check-square").remove();
        $(".note_view_header .icon-times-rectangle").remove();
        if (dirty) {
            // Add "publish" and "cancel" buttons.
            let cb_ctrl_html = '<div style="display: inline; position: absolute; right: 10px;">';
            cb_ctrl_html += '<span style="float:right; line-height: 100%; vertical-align: middle; cursor: pointer; color: #0052CC; margin-left: 5px; font-size:1.2em;" class="icon-times-rectangle"></span>';
            cb_ctrl_html += '<span style="float:right; line-height: 100%; vertical-align: middle; cursor: pointer; color: #0052CC; margin-left: 5px; font-size:1.2em;" class="icon-check-square"></span>';
            cb_ctrl_html += '</div>';
            $(".note_view_header").append(cb_ctrl_html);
            $(".note_view_header .icon-check-square").on("click", () => this.validate_cb_edition());
            $(".note_view_header .icon-times-rectangle").on("click", () => this.cancel_cb_edition());
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
        $(".note_view_header").html(note_name);
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
    note_edit(current_note_id) {
        console.log("edit " + current_note_id);
    }

}



