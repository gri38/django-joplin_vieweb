class JoplinVieweb {
    constructor() {
        this.note_view = new NoteView();
        this.side_bar = new SideBar();
        this.notes_list = new NotesList();
        
        this.route_the_events();
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
            this.side_bar.notebook_addition(visible);
            this.notes_list.note_addition(visible);
        });
        this.notes_list.on("note_selected", (note_data) => { this.note_view.get_note(note_data[0], note_data[1]) });
        this.notes_list.on("note_creation_request", () => { this.create_note(); } );
        this.note_view.on("tags_changed", () => {
            this.side_bar.set_sync_dirty();
            this.side_bar.get_tags_from_server()}
            );
        this.note_view.on("note_checkboxes_changed", () => {this.side_bar.set_sync_dirty();});
        this.note_view.on("note_edit_finished", (dirty) => {
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
    }
    
    init() {
        this.note_view.clear();
        this.side_bar.init();
    }

    create_note() {
        let current_nb_id = this.side_bar.get_selected_notebook_id();
        if (current_nb_id) {
            this.note_view.note_create(current_nb_id);
        }
        else {
            alert("Please select a notebook.")
        }
    }
}

$(window).on("load" , () => {
    var app = new JoplinVieweb();
    app.init(); 
} );
