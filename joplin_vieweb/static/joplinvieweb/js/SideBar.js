

/**
 * Emits: 
 * - 'notebook_selected', param: notebook_id
 * - 'tag_selected', param: tag_id
 */
class SideBar extends EventEmitter{
    constructor() {
        super();
    }
    
    /**
     * Retrieve the notebooks and tags from server.
     */
    init() {
        this.sync_polling = null;
        this.init_accordion();
        
        // Gets notebooks and tags from server to display them
        this.get_notebooks_from_server();
        this.get_tags_from_server();
    }
    
    /**
     *
     */
    get_notebooks_from_server() {
        display_progress($("#notebooks_tree_inner"));
        $.getJSON(
        '/joplin/notebooks/',
        (data) => { this.display_notebooks_tree(data); }
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
     *
     */
    display_notebooks_tree(data) {
        clear_progress($("#notebooks_tree_inner"));
        let tree = $('#notebooks_tree_inner');
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
        (data) => { this.display_tags(data); }
        )  .fail(() => {
            clear_progress($("#tags"));
            console.log("error while getting tags ");
            $.get(
            '/joplin/tags_error/',
            (data) => {
                        $("#tags").html(data);
                        $("#tags").find(".icon-refresh").on("click", () => this.get_tags_from_server() );
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
    udpate_sync_data(data) {
        $("#sync").html(data);
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
        
        $(".accordion_header").on("click", (ev) => { this.toggle_accordion(ev); });
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
            if (this.sync_polling != null) {
                this.sync_polling.stop();
            }
            this.sync_polling= null;
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
            this.sync_polling = new SyncPolling();
            this.sync_polling.on("sync_data", (data) => { this.udpate_sync_data(data) });
        }
            
        this.accordion_opened[elmt_ctn] = true;         
        $(elmt_ctn).css("flex", "1 1 auto");
        $(elmt).toggle(400);
    }
    
    /**
     * Toggle parts of accordion
     */
    toggle_accordion(ev) {
        let parent_id = $(ev.currentTarget).parent().attr('id');
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
}

/**
 * Emit: 'sync_data', param: html of sync data.
 */
class SyncPolling extends EventEmitter {
    constructor() {
        super();
        this.enable = true;
        this.poll();
    }
    
    poll() {
        $.get(
        '/joplin/sync/',
        (data) => { super.emit('sync_data', data) }
        ).fail(() => {
            console.log("error while getting sync data");
        });
        
        if (this.enable == true) {
            setTimeout(() => {this.poll();}, 3000);
        }
    }
    
    stop() {
        this.enable = false;
    }
}