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
        this.notes_list.on("note_selected", (note_data) => { this.note_view.get_note(note_data[0], note_data[1]) });
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
    }
    
    init() {
        this.note_view.clear();
        this.side_bar.init();
    }
}

var app = new JoplinVieweb();
$(window).on("load" , () => { app.init(); } );
