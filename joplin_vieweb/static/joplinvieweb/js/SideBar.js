/**
 * Emits: 
 * - 'notebook_selected', param: notebook_id
 */
class SideBar extends EventEmitter{
    constructor() {
        super();
    }
    
    /**
     * Retrieve the notebooks and tags from server.
     */
    init() {
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
        )  .fail(function() {
            clear_progress($("#notebooks_tree_inner"));
            console.log("error while getting notebooks ");
            $.get(
            '/joplin/notebooks_error/',
            function(data) {$("#notebooks_tree_inner").html(data);}
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
        this.display_tags
        )  .fail(function() {
            clear_progress($("#tags"));
            console.log("error while getting tags ");
            $.get(
            '/joplin/tags_error/',
            function(data) {$("#tags").html(data);}
            )
        });
    }
    
    /**
     *
     */
    display_tags(data) {
        clear_progress($("#tags"));
        $("#tags").html(data);
    }
}