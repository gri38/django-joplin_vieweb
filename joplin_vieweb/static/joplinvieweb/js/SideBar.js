

/**
 * Emits: 
 * - 'notebook_selected', param: notebook_id
 * - 'notebook_selected_and_note', param: notebook_id, note_id
 * - 'tag_selected', param: tag_id
 * - 'tag_selected_and_note', param: tag_id, note_id
 * - 'notebooks_visibility', param: boolean
 * 
 * - 'sync_over' when a joplin synch has finished and notes list should be refreshed.
 * - "sync_started" when joplin sync starts and notes list and note view shoudl be cleared
 */
class SideBar extends EventEmitter{
    constructor() {
        super();
        this.last_notes_source = null; // will be "notebook" or "tag"
        this.last_tag_id = null;
        this.last_notebook_id = null;
        this.reselect_after_reload = 0;

        $("#notebook_toolbox .icon-plus").on("click", () => { console.log("cliccccc") });
    }

    
    /**
     * Retrieve the notebooks and tags from server.
     */
    init() {
        this.sync_polling = null;
        this.init_accordion();
        this.reload();
        
        // a callback to be able to removeListener.        
        this.reload_side_bar_after_sync_handler = () => { this.reload_after_sync(); };
    }
    
    /**
     * (re)Load notebooks and tags from server and display them.
     */
    reload() {
        this.get_notebooks_from_server();
        this.get_tags_from_server();
    }

    /**
     * @return null if no note selected, otherwise the id as string
     */
    get_selected_notebook_id() {
        let selected = $('#notebooks_tree_inner').tree('getSelectedNode', this.last_notebook_id);
        if (selected) {
            return selected.id;
        }
        return null;
    }
    
    /**
     *
     */
    get_notebooks_from_server() {
        display_progress($("#notebooks_tree_inner"));
        $.getJSON(
        '/joplin/notebooks/',
        (data) => { 
            this.display_notebooks_tree(data);
            if (this.reselect_after_reload-- == 1) {
                this.reselect();
            }
        }
        )  .fail(() => {
            clear_progress($("#notebooks_tree_inner"));
            console.log("error while getting notebooks ");
            $.get(
            '/joplin/notebooks_error/',
            (data) => {
                        $("#notebooks_tree_inner").html(data);
                        $("#notebooks_tree_inner").find(".icon-refresh").on("click", () => this.get_notebooks_from_server() );
                      }
            )
        });
    }

    /**
     * select again the last selection
     */
    reselect() {
        let elmt = null;
        if (this.last_notes_source == "notebook") {
            elmt = $('.jqtree-element[data-node-id="' + this.last_notebook_id + '"]');
        }
        else { //tag
            elmt = $('.tag_item[data-tag-id="' + this.last_tag_id + '"]');
        }
        this.set_selected(this.last_notes_source, elmt);

        if (this.last_notes_source == "notebook") {
            const node = $('#notebooks_tree_inner').tree('getNodeById', this.last_notebook_id);
            $('#notebooks_tree_inner').tree('selectNode', node);
        }

        // open the notebook or tag section
        if ((this.last_notes_source == "notebook") || (this.last_notes_source == null)) {
            this.toggle_accordion("notebooks_tree_ctn");
        }
        else {
            this.toggle_accordion("tags_ctn");
        }
    }

    /**
     *
     */
    display_notebooks_tree(data) {
        clear_progress($("#notebooks_tree_inner"));
        let tree = $('#notebooks_tree_inner');
        tree.tree("destroy");
        tree.tree({
            data: data,
            autoOpen: 0,
            onCreateLi: function(node, $li) {
                $li.find('.jqtree-element').addClass("notebook").attr("data-node-id", node.id);
            },
            closedIcon: $('<span class="icon-arrow-circle-right"></span>'),
            openedIcon: $('<span class="icon-arrow-circle-down"></span>')
        });
        
        // Handle click on notebook:
        tree.on( 'click', '.notebook', (e) => {
            // If we clicked the close / open button: don't do anything:
            let target = $(e.target);
            if (!target.hasClass("icon-arrow-circle-down") && !target.hasClass("icon-arrow-circle-right")) {
                // Get the id from the 'node-id' data property
                let node_id = $(e.currentTarget).data('node-id');
                this.set_selected("notebook", node_id);
                this.last_notes_source = "notebook";
                this.last_notebook_id = node_id;
                super.emit("notebook_selected", node_id);
            }
        });
        
        // prevent unselection of notebook:
        $('#notebooks_tree_inner').bind(
            'tree.click',
            function(e) {
                if ($('#notebooks_tree_inner').tree('isNodeSelected', e.node)) {
                    e.preventDefault();
                }
            }
        );
    }
    
    /**
     *
     */
    get_tags_from_server() {
        display_progress($("#tags"));
        $.get(
        '/joplin/tags/',
        (data) => {
            this.display_tags(data);
            $("#tags").find(".icon-refresh").on("click", () => this.get_tags_from_server());
            if (this.reselect_after_reload-- == 1) {
                this.reselect();
            }
        }
        )  .fail(() => {
            clear_progress($("#tags"));
            console.log("error while getting tags ");
            $.get(
            '/joplin/tags_error/',
            (data) => {
                        $("#tags").html(data);
                      }
            )
        });
    }
    
    /**
     *
     */
    display_tags(data) {
        clear_progress($("#tags"));
        $("#tags").html(data);
        
        // Attach to each tag item click event
        $("#tags").find('li').on("click", (ev) => {
            this.set_selected("tag", $(ev.currentTarget));
            let tag_id = $(ev.currentTarget).data('tag-id');
            this.last_notes_source = "tag";
            this.last_tag_id = tag_id;
            super.emit("tag_selected", tag_id);
        });
    }
    
    /**
     * Set the selection to the target item, and unselect every other from the whole sidebar.
     * @param section: can be "notebook", "tag"
     */
    set_selected(section, elmt) {
        
        if (section != "notebook") {
            $(".jqtree-selected").removeClass("jqtree-selected");
            let tree_state = $('#notebooks_tree_inner').tree("getState");
            tree_state.selected_node = [];
            $('#notebooks_tree_inner').tree("setState", tree_state);
        }
        $(".tag_item").removeClass("selected");
        
        if (section == "tag") {
            elmt.addClass("selected");
        }
    }
    
    /**
     *
     */
    udpate_sync_started() {
        $("#sync_action").off("click");
        $("#sync_action").find("div").addClass("animated rotate_sync");
        $("#sync_action").addClass("animated");
    }
    
    /**
     *
     */
    udpate_sync_over(data) {
        $("#sync_action").off("click");
        $("#sync_action").on("click",  () => { this.trig_joplin_sync(); });
        $("#sync_action").find("div").removeClass("animated rotate_sync");
        $("#sync_action").removeClass("animated");
        $("#sync-data").html("Last: " + data);
    }
    
    /**
     *
     */
    reload_after_sync() {
        console.log("reload after sync");
        this.reset_sync_dirty();
        this.not_sync_header_back();
        if (this.sync_polling != null) {
            this.sync_polling.removeListener("sync_over", this.reload_side_bar_after_sync_handler);
        }
        
        this.reselect_after_reload = 2; 
        this.reload();
        super.emit("sync_over");
    }
         
    /**
     *
     */
    trig_joplin_sync() {
        console.log("Ask a joplin synchro");
        $("#sync_action").off("click");
        if (this.sync_polling != null) {
            this.sync_polling.on("sync_over", this.reload_side_bar_after_sync_handler);
            this.sync_polling.pause_emit();
            this.not_sync_header_readonly();
        }
        this.udpate_sync_started();
        super.emit("sync_started");
        $.get(
        '/joplin/sync/do',
        () => {
                if (this.sync_polling != null) {
                    this.sync_polling.resume_emit();
              }            
        }
        ).fail(() => {
            this.not_sync_header_back();
            if (this.sync_polling != null) {
                    this.resume_emit();
              }  
            console.log("error while trigging sync");
            this.udpate_sync_over("failed to trig sync");
        });
    }
    
    /**
     * fold tags (so they are hidden.
     * Register the click on accordion headers.
     */
    init_accordion() {
        this.accordion_opened = {
            "#notebooks_tree_ctn": true,
            "#tags_ctn": true,
            "#sync_ctn": true
        };
        
        $("#notebooks_tree_ctn").css("flex", "1 1 auto");
        this.accordion_close("#tags_ctn", "#tags");
        this.accordion_close("#sync_ctn", "#sync");
        
        this.enable_header_click();
    }
    
    /**
     *
     */
    enable_header_click() {
        $(".accordion_header").on("click", (ev) => { this.toggle_accordion_event(ev); });
    }
    
    
    /**
     *
     */
    disable_header_click() {
        $(".accordion_header").off("click");
    }
    
    /**
     *
     */
    not_sync_header_readonly() {
        this.disable_header_click()
        $(".not_sync_header").removeClass("animated_header header_back");
        $(".not_sync_header").addClass("animated_header header_readonly");
    }
    
    /**
     *
     */
    not_sync_header_back() {
        this.enable_header_click()
        $(".not_sync_header").removeClass("animated_header header_readonly");
        $(".not_sync_header").addClass("animated_header header_back");
    }
    
    /**
     * Toogle the part if it's open. Nothing if already closed.
     */
    accordion_close(elmt_ctn, elmt) {
        if (!$(elmt_ctn).length){
            return; // If synchro is not present.
        }
        
        if (this.accordion_opened[elmt_ctn] == false) {
            return; // already opened.
        } 
        
        if (elmt_ctn == "#sync_ctn") {
            this.delete_sync_info_polling();
        }
        
        this.accordion_opened[elmt_ctn] = false;         
        $(elmt_ctn).css("flex", "0 1 auto");
        $(elmt).toggle(400);
    }
    
    /**
     * Toogle the part if it's closed. Nothing if already opened.
     */
    accordion_open(elmt_ctn, elmt) {
        if (!$(elmt_ctn).length){
            return; // If synchro is not present.
        }
        
        if (this.accordion_opened[elmt_ctn] == true) {
            return; // already opened.
        }
        
        if (elmt_ctn == "#sync_ctn") {
            this.create_sync_info_polling();
        }
            
        this.accordion_opened[elmt_ctn] = true;         
        $(elmt_ctn).css("flex", "1 1 auto");
        $(elmt).toggle(400);
    }
    
    /**
     *
     */
    create_sync_info_polling() {
        this.sync_polling = new SyncPolling();
        this.sync_polling.on("sync_started", () => { this.udpate_sync_started() });
        this.sync_polling.on("sync_over", (data) => { this.udpate_sync_over(data) });
    }
    
    /**
     *
     */
    delete_sync_info_polling() {
        if (this.sync_polling != null) {
            this.sync_polling.stop();
        }
        this.sync_polling= null;
    }
    
    /**
     * Toggle parts of accordion
     */
    toggle_accordion_event(ev) {
        let parent_id = $(ev.currentTarget).parent().attr('id');
        this.toggle_accordion(parent_id);
    }

    /**
     * show or hide the + button to add a notebook.
     * @param {boolean} visible 
     */
    notebook_addition(visible) {
        if (visible) {
            $("#notebook_toolbox").show(400);
        }
        else {
            $("#notebook_toolbox").hide(400);
        }
    }

    /**
     * Toggle accordion according to id of clicked header
     * @param {string} parent_id Expected values: "notebooks_tree_ctn", "tags_ctn", "sync_ctn"
     */
    toggle_accordion(parent_id) {
        if (parent_id == "notebooks_tree_ctn") {
            super.emit("notebooks_visibility", true)
        }
        else {
            super.emit("notebooks_visibility", false)
        }
        if (parent_id == "notebooks_tree_ctn") {
            this.accordion_open("#notebooks_tree_ctn", "#notebooks_tree");
            this.accordion_close("#tags_ctn", "#tags");
            this.accordion_close("#sync_ctn", "#sync");
        }
        else if (parent_id == "tags_ctn") {
            this.accordion_close("#notebooks_tree_ctn", "#notebooks_tree");
            this.accordion_open("#tags_ctn", "#tags");
            this.accordion_close("#sync_ctn", "#sync");
        }
        else if (parent_id == "sync_ctn") {
            this.accordion_close("#notebooks_tree_ctn", "#notebooks_tree");
            this.accordion_close("#tags_ctn", "#tags");
            this.accordion_open("#sync_ctn", "#sync");
        }
    }

    /**
     * 
     */
    set_sync_dirty() {
        let sync_header = $("#sync_ctn > .header");
        if (sync_header.find('.dirty').length == 0) {
            sync_header.append('<span class="dirty" />');
        }
    }

    /**
     * 
     */
    reset_sync_dirty () {
        $(".dirty").remove();
    }
}

/**
 * Emit:
 * - 'sync_started'
 * - 'sync_over', param: last sync date
 */
class SyncPolling extends EventEmitter {
    constructor() {
        super();
        this.enable = true;
        this.sync_ongoing = true;
        this.pause = false;
        this.poll();
    }
    
    /**
     *
     */
    poll() {
        $.get(
        '/joplin/sync/',
        (data) => { this.process_sync_data(data); }
        ).fail(() => {
            console.log("error while getting sync data");
        });
        
        if (this.enable == true) {
            setTimeout(() => {this.poll();}, 3000);
        }
    }
    
    /**
     * We don't pause the pollin, but sto emitting the polling result.
     */
    pause_emit() {
        this.pause = true;
    }
    
    /**
     * resule emitting polling info.
     */
    resume_emit() {
        this.pause = false;
    }
     
    /**
     *
     */
    process_sync_data(data) {
        if (data == "ongoing") {
            if (this.sync_ongoing == false) {
                this.sync_ongoing = true;
                if (this.pause == false) {
                    super.emit('sync_started')
                }
            }
        }
        else {
            if (this.sync_ongoing == true) {
                this.sync_ongoing = false;
                if (this.pause == false) {
                    super.emit('sync_over', data);
                }
            }
        }
    }
    
    /**
     *
     */
    stop() {
        this.enable = false;
    }
}