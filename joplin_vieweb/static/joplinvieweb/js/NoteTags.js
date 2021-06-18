/**
 * Emits:
 * - 'tags_edited'
 * - 'tags_changed'
 */
class NoteTags extends EventEmitter {
    constructor(note_view_elmt) {
        super();
        this.note_view_elmt = note_view_elmt;
        this.current_note_id = null;
        this.all_tags = [];
        this.note_tags = [];
        this.edition = false;
    }
    
    /**
     * 
     */
    set_note_id(note_id) {
        this.current_note_id = note_id;
    }

    /**
    *
    */
    get_note_tags(note_id) {
        $.getJSON(
            '/joplin/notes/' + note_id + "/tags",
            (data) => { this.display_note_tags(data); }
        );
    }

    /**
     *
     */
    display_note_tags(data) {
        let tags_html = '<div id="note_tags"><span class="icon-s-tags"></span><span id="note_tags_tags"></span></div>';
        $(this.note_view_elmt).prepend(tags_html);
        for (let one_tag of data) {
            this.add_tag(one_tag);
        }

        if ($("#note_tags").html().includes(">public<")) {
            $("#note_tags").prepend('<a class="public_link" href="/joplin/notes/public/' + this.current_note_id + '" target="_blank"><span class="icon-link"></a>')
        }
        $("#note_tags .icon-s-tags").on("click", () => this.start_tag_edition());
    }

    /**
     * 
     */
    move_tag_from_all_to_note(tag) {
        this.note_tags.push(tag);
        let index_to_remove = this.all_tags.findIndex(k => k == tag);
        if (index_to_remove != -1) {
            this.all_tags.splice(index_to_remove, 1);
        }
    }

    /**
     * 
     */
    move_tag_from_note_to_all(tag) {
        this.all_tags.push(tag);
        let index_to_remove = this.note_tags.findIndex(k => k == tag);
        if (index_to_remove != -1) {
            this.note_tags.splice(index_to_remove, 1);
        }
    }

    /**
     * 
     */
    start_tag_edition() {
        this.edition = true;
        this.all_tags = [];
        this.note_tags = [];
        
        //
        // Add the input suggest
        //
        $("#note_tags").append('<input type="text" class="clearable x onX" name="add_tag_edit" id="add_tag_edit"/>');
        // register enter key in add tag input:
        $("#add_tag_edit").keyup((e) => {
            if (e.keyCode == 13) {
                this.add_tag($("#add_tag_edit").val());
            }
        });

        // Disable click on tag icon
        $("#note_tags .icon-s-tags").off("click");
        
        // Add edit class to skin the tags for edition
        $("#note_tags").addClass("edit");

        // Add "publish" and "cancel" buttons.
        $("#note_tags").append('<span style="line-height: 100%; vertical-align: middle; cursor: pointer; color: #0052CC; margin-left: 5px; font-size:1.2em;" class="icon-check-square"></span>');
        $("#note_tags").append('<span style="line-height: 100%; vertical-align: middle; cursor: pointer; color: #0052CC; margin-left: 5px; font-size:1.2em;" class="icon-times-rectangle"></span>');
        $("#note_tags .icon-check-square").on("click", () => this.validate_tag_edition());
        $("#note_tags .icon-times-rectangle").on("click", () => this.finish_tag_edition());
        
        // Let's add a remove button to each tag
        this.add_delete_button_to_tags();

        $.getJSON(
            '/joplin/tags/all',
            (data) => {

                // Fill all tags array
                for (let one_tag of data) {
                    this.all_tags.push(one_tag["title"]);
                }

                // fill note tags array (and remove from all tags array)
                $(".tag_label").each((index, el) => {
                    let tag_label = $(el).text();
                    this.move_tag_from_all_to_note(tag_label);
                });

                // Let's add a add_tag_edit
                $("#add_tag_edit").autocomplete({
                    lookup: this.get_autocomplete_lookup(),
                    minChars: 0,
                    onSelect: (suggestion) => {
                        this.add_tag(suggestion.value);
                    }
                });
            });
    }

    /**
     * 
     */
    refresh_suggests() {
        $("#add_tag_edit").autocomplete("setOptions", { lookup: this.get_autocomplete_lookup() });
    }

    /**
     * Add a delete button to each tag for edit mode.
     */
    add_delete_button_to_tags() {
        $(".note_tag:not(:has(.delete_tag))").append('<span class="delete_tag">X</span>');
        $(".delete_tag").off("click");
        $(".delete_tag").on("click", (ev) => {
            this.delete_tag($(ev.currentTarget).parent(), $(ev.currentTarget).parent().find(".tag_label").text())
        });
    }

    /**
     * A tag has just benn added locally.
     * This function displays the tag in the note tags list, and remove the tag from the suggest for new tag.
     */
    add_tag(tag) {
        let tag_html = '<span class="note_tag"><span class="tag_label">' + tag + '</span></span>';
        // get the last tag to append the new one.
        $("#note_tags_tags").append(tag_html);

        if (this.edition) {
            this.move_tag_from_all_to_note(tag);
            $("#add_tag_edit").val("");
            this.add_delete_button_to_tags();
            this.refresh_suggests();
        }
    }

    /**
     * in this form:
     *  [{ value: 'tag1', data: 'tag1' },{ value: 'tag2', data: 'tag2' }]
     */
    get_autocomplete_lookup() {
        let lookup = [];
        for (let one_tag of this.all_tags) {
            lookup.push({"value": one_tag, "data": one_tag});
        }
        return lookup;
    }

    /**
     * 
     */
    add_tag_edit_html() {
        let html = '<select class="flexselect">\n';
        for (let one_tag of this.all_tags) {
            html += '    <option value="' + one_tag +'">' + one_tag + '</option>\n';
        }
        html += '</select>\n';
        return html;
    }

    /**
     * 
     */
    delete_tag(elm, tag) {
        elm.fadeOut(300, () => { elm.remove(); });
        this.move_tag_from_note_to_all(tag);
        this.refresh_suggests();
    }

    /**
     * 
     */
    validate_tag_edition() {
        $("#note_tags").remove();

        $.ajax({
            url: '/joplin/notes/' + this.current_note_id + "/tags",
            type: 'post',
            data: JSON.stringify({ "tags": this.note_tags }),
            //data: { "tags": this.note_tags },
            headers: {"X-CSRFToken": csrftoken},
            complete: () => { 
                super.emit("tags_changed");
                this.finish_tag_edition();
            }
        });
    }

    /**
     * 
     */
    finish_tag_edition() {
        $("#note_tags").remove();
        super.emit("tags_edited");
    }
}