class JoplinVieweb {
    constructor() {
        this.note_view = new NoteView();
        this.side_bar = new SideBar();
        this.notes_list = new NotesList();
        
        this.route_the_events();

        this.add_icons_visible = true;
        this.note_edition_ongoing = false; // true when editing or creating. 
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
        this.notes_list.on("note_selected", (note_data) => { this.note_view.get_note(note_data[0], note_data[1]) });
        this.notes_list.on("note_creation_request", () => { this.create_note(); } );
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