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
        //
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
     * fold tags (so they are hidden.
     * Register the click on accordion headers.
     */
    init_accordion() {
        $("#tags").toggle();
        $("#notebooks_tree_ctn").css("flex", "1 1 auto");
        $("#tags_ctn").css("flex", "0 0 auto");
        
        $(".accordion_header").on("click", () => { this.toggle_accordion(); });
    }
    
    /**
     * Toggle one element of accordion
     */
    toggle_one_accordion_part(elmt_ctn, elmt) {
        let g1 = elmt_ctn.css("flex-grow");
        let s1 = elmt_ctn.css("flex-shrink");
        elmt.toggle(400);
        elmt_ctn.css("flex-grow", (g1 == "1") ? "0" : "1");
        elmt_ctn.css("flex-shrink", (s1 == "1") ? "0" : "1");
    }
    
    /**
     * Toggle parts of accordion
     */
    toggle_accordion() {
        this.toggle_one_accordion_part($("#notebooks_tree_ctn"), $("#notebooks_tree"));
        this.toggle_one_accordion_part($("#tags_ctn"), $("#tags"));
    }
}