class JoplinVieweb {
    constructor() {
        this.register_edit_keys();
        this.note_view = new NoteView();
        this.side_bar = new SideBar();
        this.notes_list = new NotesList();
        
        this.route_the_events();

        this.add_icons_visible = true;
        this.note_edition_ongoing = false; // true when editing or creating. 
    }

    register_edit_keys() {
        $(document).keydown(function (event) {
            //console.log(event.ctrlKey + " " + event.which)
            // is e pressed without modifiers?
            if (event.which == 69 && !event.metaKey && !event.altKey && !event.ctrlKey && !event.shiftKey) {
                let pencil = $("#note_edit_edit");
                if (pencil.length) {
                    pencil.click();
                }
                event.preventDefault();
            }
            // is ctrl + s pressed?
            else if (event.which == 83 && !event.metaKey && !event.altKey && event.ctrlKey && !event.shiftKey) {
                let save = $("#note_edit_commit");
                if (save.length) {
                    save.click();
                }
                event.preventDefault();
            }
            // is esc pressed?
            else if (event.which == 27 && !event.metaKey && !event.altKey && !event.ctrlKey && !event.shiftKey) {
                let cancel = $("#note_edit_cancel");
                if (cancel.length) {
                    cancel.click();
                }
                event.preventDefault();
            }
        });
    }
    
    route_the_events() {
        this.side_bar.on("notebook_selected", () => { this.note_view.clear(); });
        this.side_bar.on("notebook_selected", (notebook_id) => {
            this.notes_list.get_from_notebook(notebook_id);
        });
        this.side_bar.on("tag_selected", () => { this.note_view.clear(); });
        this.side_bar.on("tag_selected", (tag_id) => { this.notes_list.get_from_tag(tag_id); });
        this.side_bar.on("sync_over", () => { 
            this.notes_list.refresh_and_select();
         });
        this.side_bar.on("sync_started", () => {
            this.note_view.clear();
            this.notes_list.clear();
         });
        this.side_bar.on("notebooks_visibility", (visible) => {
            this.add_icons_set_visible(visible);
        });
        this.side_bar.on("refresh_lasts_notes", () => { this.notes_list.get_lasts_notes(); });
        this.side_bar.on("please hide notes history", () => { this.notes_list.hide_lasts() });
        this.side_bar.on("please show notes history", () => { this.notes_list.show_lasts() });
        this.notes_list.on("note_selected", (note_data) => { this.note_view.get_note(note_data[0], note_data[1]) });
        this.notes_list.on("note_creation_request", () => { this.create_note(); } );
        this.notes_list.on("note_notebook_selected", (selection) => {
            let note_id = selection[0];
            let notebook_id = selection[1];
            this.side_bar.select_notebook(notebook_id);
            this.notes_list.refresh_and_select_note_from_notebook(note_id, notebook_id);
        });
        this.note_view.on("tags_changed", () => {
            this.side_bar.set_sync_dirty();
            this.side_bar.get_tags_from_server()}
            );
        this.note_view.on("note_checkboxes_changed", () => {this.side_bar.set_sync_dirty();});
        this.note_view.on("note_edit_started", () => { this.note_edition_set_ongoing(true); });
        this.note_view.on("cleared", () => { this.note_edition_set_ongoing(false); });
        this.note_view.on("note_edit_finished", (dirty) => {
            this.note_edition_set_ongoing(false);
            if (dirty) {
                this.side_bar.set_sync_dirty();
            }
            this.note_view.clear();
            this.notes_list.refresh_and_select();
        });
        this.note_view.on("note_created", (new_note_id) => {
            this.side_bar.set_sync_dirty();
            this.note_view.clear();
            this.notes_list.refresh_and_select_note(new_note_id);
        });
        this.note_view.on("note_displayed", () => {
            this.notes_list.get_lasts_notes();
        });
        this.note_view.on("note_deleted", () => {
            this.notes_list.get_lasts_notes();
        })
    }
    
    init() {
        this.note_view.clear();
        this.side_bar.init();
        this.notes_list.get_lasts_notes(true);
    }

    create_note() {
        let current_nb_id = this.side_bar.get_selected_notebook_id();
        if (current_nb_id) {
            this.note_view.note_create(current_nb_id);
        }
        else {
            $("#note_create_please_select_notebook_popup").modal({ fadeDuration: 100 });
        }
    }

    add_icons_set_visible(visible) {
        this.add_icons_visible = visible;
        this.update_add_icons();
    }
    
    note_edition_set_ongoing(ongoing) {
        this.note_edition_ongoing = ongoing;
        this.update_add_icons();
    }

    update_add_icons() {
        if ((this.add_icons_visible == false) || (this.note_edition_ongoing == true)) {
            this.side_bar.notebook_addition(false);
            this.notes_list.note_addition(false);
        }
        else {
            this.side_bar.notebook_addition(true);
            this.notes_list.note_addition(true);
        }
    }

}

$(window).on("load" , () => {
    var app = new JoplinVieweb();
    app.init(); 
} );


function scroll_to(title) {
    let tinit = $('#note_view').scrollTop();
    $('#note_view').scrollTop(0);
    let t = $(title).position().top;
    let h = $(title).height();
    $('#note_view').scrollTop(tinit);
    $('#note_view').animate({ scrollTop: t - h}, 'slow');
}