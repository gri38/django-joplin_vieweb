/**
 * Emit: 
 *  - "tags_changed"
 *  - "note_checkboxes_changed"
 *  - "note_edit_started": when note edition or creation started.
 *  - "note_edit_finished", param: dirty=true ou false (true: commit, false: cancel.)
 *  - "cleared"
 *  - "note_created", param: new_note_id
 *  - "note_displayed"
 *  - "note_deleted"
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
        super.emit("cleared");
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
                    super.emit("note_displayed");
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

        $("#note_view").find(".codehilite").append('<center class="expend_code"><i>Click to expand...</i></center><div class="code_ctrl"><span class="toggle_code_btn icon-chevron-circle-down"></span></div>')
        $(".toggle_code_btn").on("click", (ev) => { // Let's fold
            this.fold_code($(ev.currentTarget));
        });
        
        $('.toc').draggabilly({});

        if (this.is_public == false) {
            $('#note_view input[type=checkbox]').on("click", () => {
                this.handle_checkboxes();
            });
        }

        this.add_hover_link();
    }

    /**
     * For each a tag of #note_view, we add a hover callback to dispaly a link preview
     */
    add_hover_link() {
        $("#note_view a").each((index, el) => {
            let current_link = $(el);
            let href = current_link.attr('href');
            if (href.startsWith("https://") || href.startsWith("http://")) {
                current_link.hover((event) => { this.display_hyperlink_preview(event); }, 
                                   (event) => { this.hide_hyperlink_preview(event); })
            }
        });
    }

    /**
     * 
     */
    display_hyperlink_preview(event) {
        let link = event.target["href"];
        let preview_html = this.get_hyperlink_preview_template(link);
        $("#note_view").append(preview_html);
        $(".hlp-img").height($(".hlp-informations").outerHeight());
        let img = $(".hlp-img img");
        img.height("100%");
        img.width(img.height() * 2/3);
        $('.hlp').css({ 'top': event.pageY + 10, 'left': $("#note_view").position().left + 10, 'width': $("#note_view").width()});
        this.hlp_req = $.getJSON(
            '/joplin/notes/hyperlink/' + btoa(link).replace("/", "_"),
            (data) => { this.fill_hlp_preview(data, link); }
        ).fail(() => { this.hide_hyperlink_preview(event) })
    }

    /**
     * 
     */
    hide_hyperlink_preview(event) {
        $('.hlp').remove();
        this.hlp_req.abort();
    }

    /**
     * hyperlink preview is "blinking" waiting for data.
     * When they are received, this function set the data instead of the link (except for img if data has no img)
     */
    fill_hlp_preview(data, link) {
        console.debug(data);
        let type = data["type"];
        if (type == null) {
            type = "website";
        }
        let img_src = data['image'];
        let desc_height = $(".hlp-info-desc").height();
        if (img_src == null) {
            $(".hlp-img").addClass("wait-placeholder");
            this.hlp_req = $.getJSON('/joplin/notes/hyperlink_image/' + btoa(link).replace("/", "_"),
            (data) => {
                    $(".hlp-img").removeClass("wait-placeholder");
                    $(".hlp-img img").attr("src", data["image"]);
                    $(".hlp-img img").css('width', 'auto');
                }
                ).fail(() => {
                    $(".hlp-img").removeClass("wait-placeholder");
                });
            $(".hlp-info-type").html(type);
            $(".hlp-info-title").html(data["title"]);
            $(".hlp-info-desc").html("<span>" + data["description"] + "</span>");
            $(".hlp-info-desc").height(desc_height);
            $(".hlp-info-domain span").html(data["domain"]);
            $(".hlp").removeClass("wait-placeholder");
        }
        else {
            $(".hlp-img img").on("load", () => {
                $(".hlp-img img").css('width', 'auto');
                $(".hlp-info-type").html(type);
                $(".hlp-info-title").html(data["title"]);
                $(".hlp-info-desc").html("<span>" + data["description"] + "</span>");
                $(".hlp-info-desc").height(desc_height);
                $(".hlp-info-domain span").html(data["domain"]);
                $(".hlp").removeClass("wait-placeholder");
            });
            $(".hlp-img img").attr("src", img_src);
        }
    }

    /**
     * fold a code block and change the button to right arrow
     */
    fold_code(btn) {
        btn.toggleClass("icon-chevron-circle-down");
        btn.toggleClass("icon-chevron-circle-right");
        if (btn.hasClass("icon-chevron-circle-right")) {
            btn.parent().parent().find("pre").fadeToggle(() => {
                btn.parent().parent().find(".expend_code").fadeToggle();
                });
        }
        else {
            btn.parent().parent().find(".expend_code").fadeToggle(() => {
                btn.parent().parent().find("pre").fadeToggle();
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
        
        // Let's set checked attribute to true when the cb is checked:
        $('#note_view input[type=checkbox]').each((index, el) => {
            let current_cb = $(el);
            if (current_cb.is(":checked")) {
                current_cb.attr("checked", "checked");
            }
            else {
                current_cb.removeAttr("checked");
            }
        });
        this.handle_checkboxes();
        $.ajax({
            url: '/joplin/notes/' + note_id + "/checkboxes",
            type: 'post',
            data: JSON.stringify({ "cb": checkboxes }),
            headers: { "X-CSRFToken": csrftoken },
            complete: () => {
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
        let session_id = "";

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
            super.emit("note_edit_started");
            let note_editor = new NoteEditor(note_id, note_name, session_id);
            note_editor.init(md);
            note_editor.on("cancel", () => {
                super.emit("note_edit_finished", false);
            });
            note_editor.on("commit", () => {
                super.emit("note_edit_finished", true);
            });
        }
        );
    }
    
    /**
     * 
     * @param {*} notebook_id 
     */
    note_create(notebook_id) {
        this.clear();
        display_progress($("#note_view"));
        let md = "";
        let session_id = "";
        
        // create an edit session and get the id
        $.ajax({
            url: '/joplin/edit_session/',
            type: 'post',
            headers: { "X-CSRFToken": csrftoken },
            complete: (data) => {
                session_id = data.responseText;
                super.emit("note_edit_started");
                let note_editor = new NoteEditor(null, null, session_id);
                note_editor.init("");
                note_editor.set_notebook_id(notebook_id);
                note_editor.on("cancel", () => {
                    super.emit("note_edit_finished", false);
                });
                note_editor.on("commit", () => {
                    let new_note_id = note_editor.note_id;
                    super.emit("note_created", new_note_id);
                });
            }
        });
    }
    
    /**
     * 
     */
    note_delete(note_id, note_name) {
        $("#note_delete_popup_note_name").html(note_name);
        $("#note_delete_popup").modal({ fadeDuration: 100 });

        // unregister events after modal is closed.
        $("#note_delete_popup").on($.modal.CLOSE, function (event, modal) {
            $("#note_delete_popup").find("*").off();
            $("#note_delete_popup").off();
        });

        // cancel button close modal:
        $("#note_delete_popup .button_Cancel").on("click", () => {
            $("#note_delete_popup .button_Cancel").off("click");
            $.modal.close();
        });
        
        // Delete button deletes:
        $("#note_delete_popup .button_OK").on("click", () => {
            $("#note_delete_popup .button_OK").off("click");
            $.modal.close();
            $.ajax({
                url: '/joplin/notes/' + note_id + "/delete",
                type: 'post',
                headers: { "X-CSRFToken": csrftoken },
                complete: () => { super.emit("note_edit_finished", true);
                                  super.emit("note_deleted");    
                                }
            });
        });
    }

    /**
     * 
     * @returns the html template of the preview
     */
    get_hyperlink_preview_template(url) {
        let html = '<div class="hlp wait-placeholder">\n';
        html += '    <div class="hlp-img">\n';
        html += '        <img/>\n';
        html += '    </div>\n';
        html += '    <div class="hlp-informations">\n';
        html += '        <div class="hlp-info-header">\n';
        html += '            <span class="hlp-info-type"><!--PLACEHOLDER_TYPE-->&nbsp;</span>\n';
        html += '            <a href="' + url + '" class="hlp-info-title hlp-wait-line"><!--PLACEHOLDER_TITLE-->&nbsp;</a>\n';
        html += '        </div>\n';
        html += '        <div class="hlp-info-desc">\n';
        html += '            <!--PLACEHOLDER_DESC--><span class="hlp-desc-line hlp-wait-line">&nbsp;</span><span class="hlp-desc-line hlp-wait-line">&nbsp;</span><span class="hlp-desc-line hlp-wait-line">&nbsp;</span><span class="hlp-desc-line hlp-wait-line">&nbsp;</span>\n';
        html += '        </div>\n';
        html += '        <div class="hlp-info-domain">\n';
        html += '            <svg class="hlp-info-link-ico" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px"\n';
        html += '                y="0px" width="512px" height="512px" viewBox="0 0 512 512" enable-background="new 0 0 512 512" xml:space="preserve">\n';
        html += '                <script xmlns="" id="__gaOptOutExtension" />\n';
        html += '                <path fill="#010101"\n';
        html += '                    d="M459.654,233.373l-90.531,90.5c-49.969,50-131.031,50-181,0c-7.875-7.844-14.031-16.688-19.438-25.813  l42.063-42.063c2-2.016,4.469-3.172,6.828-4.531c2.906,9.938,7.984,19.344,15.797,27.156c24.953,24.969,65.563,24.938,90.5,0  l90.5-90.5c24.969-24.969,24.969-65.563,0-90.516c-24.938-24.953-65.531-24.953-90.5,0l-32.188,32.219  c-26.109-10.172-54.25-12.906-81.641-8.891l68.578-68.578c50-49.984,131.031-49.984,181.031,0  C509.623,102.342,509.623,183.389,459.654,233.373z M220.326,382.186l-32.203,32.219c-24.953,24.938-65.563,24.938-90.516,0  c-24.953-24.969-24.953-65.563,0-90.531l90.516-90.5c24.969-24.969,65.547-24.969,90.5,0c7.797,7.797,12.875,17.203,15.813,27.125  c2.375-1.375,4.813-2.5,6.813-4.5l42.063-42.047c-5.375-9.156-11.563-17.969-19.438-25.828c-49.969-49.984-131.031-49.984-181.016,0  l-90.5,90.5c-49.984,50-49.984,131.031,0,181.031c49.984,49.969,131.031,49.969,181.016,0l68.594-68.594  C274.561,395.092,246.42,392.342,220.326,382.186z" />\n';
        html += '            </svg>\n';
        html += '            <span class="hlp-wait-line"><!--PLACEHOLDER_DOMAIN-->&nbsp;</span>\n';
        html += '        </div>\n';
        html += '    </div>\n';
        html += '</div>\n';
        return html;
    }

}



