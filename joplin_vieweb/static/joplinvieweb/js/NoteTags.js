
class NoteTags  {
    constructor(note_view_elmt) {
        this.note_view_elmt = note_view_elmt;
        this.current_note_id = null;
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
        $.get(
            '/joplin/notes/' + note_id + "/tags",
            (data) => { this.display_note_tags(data); }
        );
    }

    /**
     *
     */
    display_note_tags(data) {
        $(this.note_view_elmt).prepend(data);
        if (data.includes(">public<")) {
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
        this.all_tags = [];
        this.note_tags = [];
        
        $("#note_tags").append('<input type="text" class="clearable x onX" name="add_tag_edit" id="add_tag_edit"/>');
        // register enter key in add tag input:
        $("#add_tag_edit").keyup((e) => {
            if (e.keyCode == 13) {
                this.add_tag($("#add_tag_edit").val());
            }
        });

        $("#note_tags .icon-s-tags").off("click");
        $("#note_tags").addClass("edit");
        $("#note_tags").append('<span style="line-height: 100%; vertical-align: middle; cursor: pointer; color: #00ae00; margin-left: 5px; font-size:1.2em;" class="icon-check-square"></span>');
        $("#note_tags").append('<span style="line-height: 100%; vertical-align: middle; cursor: pointer; color: #FF6C6C; margin-left: 5px; font-size:1.2em;" class="icon-times-rectangle"></span>');
        $("#note_tags .icon-check-square").on("click", () => this.validate_tag_edition());
        $("#note_tags .icon-times-rectangle").on("click", () => this.cancel_tag_edition());
        
        // Let's add a remove button to each tag
        $(".note_tag").append('<span class="delete_tag">X</span>');
        $(".delete_tag").on("click", (ev) => this.delete_tag($(ev.currentTarget).parent(), $(ev.currentTarget).parent().find(".tag_label").text()));


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

                    // Let's add a add_tag_edit
                    $("#add_tag_edit").autocomplete({
                        lookup: this.get_autocomplete_lookup(),
                        minChars: 0,
                        onSelect: (suggestion) => {
                            this.add_tag(suggestion.value);
                            }
                    });
                });
            });
    }

    /**
     * 
     */
    add_tag(tag) {
        console.log("add tag " + tag);
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
    }

    /**
     * 
     */
    end_tag_edition() {
        $("#note_tags").removeClass("edit");
        $("#note_tags .icon-check-square").remove();
        $("#note_tags .icon-times-rectangle").remove();
        $("#note_tags .icon-s-tags").on("click", () => this.start_tag_edition());
        // Let's remove the remove button to each tag
        $(".delete_tag").remove();
    }

    /**
     * 
     */
    validate_tag_edition() {
        this.end_tag_edition();
    }

    /**
     * 
     */
    cancel_tag_edition() {
        this.end_tag_edition();
    }
}