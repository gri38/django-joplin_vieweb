

/**
 * Emits: 
 * - 'notebook_selected', param: notebook_id
 * - 'notebook_selected_and_note', param: notebook_id, note_id
 * - 'tag_selected', param: tag_id
 * - 'tag_selected_and_note', param: tag_id, note_id
 * - 'notebooks_visibility', param: boolean
 * - 'refresh_lasts_notes'
 * 
 * - 'sync_over' when a joplin synch has finished and notes list should be refreshed.
 * - "sync_started" when joplin sync starts and notes list and note view shoudl be cleared
 * 
 * - "please hide notes history"
 * - "please show notes history"
 */
class SideBar extends EventEmitter{
    constructor() {
        super();
        this.last_notes_source = null; // will be "notebook" or "tag"
        this.last_tag_id = null;
        this.last_notebook_id = null;
        this.reselect_after_reload = 0;
        this.reselect_after_reload_also_notes = false;

        this.notebook_addition(true);
        $("#notebook_toolbox .icon-plus1").on("click", () => { this.create_notebook() });
        $("#notebook_toolbox .icon-pencil").on("click", () => { this.edit_or_delete_notebook() });
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
     * @return null if no notebook selected, otherwise the id as string
     */
    get_selected_notebook_id() {
        let selected = $('#notebooks_tree_inner').tree('getSelectedNode');
        if (selected) {
            return selected.id;
        }
        return null;
    }
    
    /**
     * @return null if no notebook selected, otherwise the name as string
     */
    get_selected_notebook_name() {
        let selected = $('#notebooks_tree_inner').tree('getSelectedNode');
        if (selected) {
            return selected.name;
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
            $('#notebooks_tree_inner').tree('selectNode', null);
            $('#notebooks_tree_inner').tree('selectNode', node);
        }

        // open the notebook or tag section
        if ((this.last_notes_source == "notebook") || (this.last_notes_source == null)) {
            this.toggle_accordion("notebooks_tree_ctn");
        }
        else {
            this.toggle_accordion("tags_ctn");
        }

        // also reload notes ?
        if (this.reselect_after_reload_also_notes == true) {
            this.reselect_after_reload_also_notes = false;
            super.emit("notebook_selected", this.last_notebook_id); // for now, only last_notebook_id is involved when reselect_after_reload_also_notes == true
        }
    }
    
    /**
     * Select the given notebook id, and unfold notebook section.
     * @param {*} notebook_id 
     */
    select_notebook(notebook_id) {
        this.reselect_after_reload_also_notes = false;
        this.last_notes_source = "notebook";
        this.last_notebook_id = notebook_id;
        this.reselect();
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

        tree.on('tree.select', (event) => {
                if (event.node) {
                    // node was selected
                    this.notebook_addition(true);
                }
            }
        );
        
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
        super.emit("please show notes history");
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
            super.emit("please hide notes history");
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
            super.emit("please show notes history");
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
     * Also show / add trash icon according to notebook selected or not.
     * @param {boolean} visible 
     */
    notebook_addition(visible) {
        let notebook_selected = this.get_selected_notebook_id();

        if (visible) {
            if (notebook_selected != null) {
                $("#notebook_toolbox .icon-pencil").show(400);
                $("#notebook_toolbox").show(400);
            }
            else {
                $("#notebook_toolbox .icon-pencil").hide(0, () => { $("#notebook_toolbox").show(400); });
            }
            
        }
        else {
            $("#notebook_toolbox").hide(400, () => {
                if (notebook_selected != null) {
                    $("#notebook_toolbox .icon-pencil").show(0);
                }
                else {
                    $("#notebook_toolbox .icon-pencil").hide(0);
                }
            });
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

    /**
     * 
     */
    create_notebook() {
        let selected_notebook_id = this.get_selected_notebook_id();
        let parent_id = null;
        if (selected_notebook_id) {
            parent_id = selected_notebook_id;
        }

        //
        // Popup
        //
        if (parent_id == null) {
            $("#new_nb_with_parent_radio").hide();
            $('label[for="new_nb_with_parent_radio"]').hide();
            $("#new_nb_root_radio").prop('checked', true);
        }
        else {
            $("#new_nb_with_parent_radio").show();
            $('label[for="new_nb_with_parent_radio"]').show();
            $("#new_nb_with_parent_name").html(this.get_selected_notebook_name());
            $("#new_nb_root_radio").prop('checked', false);
            $("#new_nb_with_parent_radio").prop('checked', true);
        }
        $("#notebook_create_popup").modal({fadeDuration: 100 });

        // unregister events after modal is closed.
        $("#notebook_create_popup").on($.modal.CLOSE , function (event, modal) {
            $("#notebook_create_popup").find("*").off();
            $("#notebook_create_popup").off();
        });
        
        $("#notebook_create_popup .button_Cancel").on("click", () => { 
            $.modal.close();
        });
        
        $("#notebook_create_popup .button_OK").on("click", () => { 
            if ($("#new_nb_root_radio").prop('checked')) {
                parent_id = "0";
            }
            let title = $("#nb_title").val();
            if (title == "") {
                $("#notebook_create_popup_error_no_title").modal({ fadeDuration: 100 });
            }
            else {
                $.ajax({
                    url: '/joplin/notebooks/' + parent_id + "/",
                    type: 'post',
                    headers: { "X-CSRFToken": csrftoken },
                    data: JSON.stringify({ "parent_id": parent_id, "title": title }),
                    complete: (new_id) => {
                        this.set_sync_dirty();
                        this.last_notes_source = "notebook";
                        this.last_notebook_id = new_id.responseText;
                        this.reselect_after_reload = 2;
                        this.reselect_after_reload_also_notes = true;
                        this.reload();
                    }
                });
                $.modal.close();
            }
        });

        $("#notebook_create_popup").on($.modal.OPEN, function (event, modal) {
            $("#nb_title").val('');
            $("#nb_title").focus();
        });
    }

    edit_or_delete_notebook() {
        // Display edit or delete popup
        let name = this.get_selected_notebook_name();
        $("#edit_or_delete_notebook_nb_name").html(name);
        $("#edit_or_delete_notebook_popup").modal({ fadeDuration: 100 });

        // unregister events after modal is closed.
        $("#edit_or_delete_notebook_popup").on($.modal.CLOSE, function (event, modal) {
            $("#edit_or_delete_notebook_popup").find("*").off();
            $("#edit_or_delete_notebook_popup").off();
        });

        // on edit:
        $("#edit_or_delete_notebook_popup .button_edit").on("click", () => {
            $.modal.close();
            this.rename_notebook();
        });


        // on delete:
        $("#edit_or_delete_notebook_popup .button_delete").on("click", () => {
            $.modal.close();
            this.delete_notebook();
        });
    }

    delete_notebook() {
        //
        // display confirm popup
        //
        let name = this.get_selected_notebook_name();
        $("#notebook_delete_popup_nb_name").html(name);
        $("#notebook_delete_popup").modal({ fadeDuration: 100 });

        // cancel button close modal:
        $("#notebook_delete_popup .button_Cancel").on("click", () => {
            $.modal.close();
        });


        // unregister events after modal is closed.
        $("#notebook_delete_popup").on($.modal.CLOSE, function (event, modal) {
            $("#notebook_delete_popup").find("*").off();
            $("#notebook_delete_popup").off();
        });

        // Delete button deletes:
        $("#notebook_delete_popup .button_OK").on("click", () => {
            let notebook_id = this.get_selected_notebook_id();
            $.ajax({
                url: '/joplin/notebooks/' + notebook_id + "/delete/",
                type: 'post',
                headers: { "X-CSRFToken": csrftoken },
                complete: () => {
                    this.set_sync_dirty();
                    this.last_notes_source = "notebook";
                    this.last_notebook_id = null;
                    this.reselect_after_reload = 2;
                    this.reselect_after_reload_also_notes = true;
                    this.reload();
                    super.emit("refresh_lasts_notes");
                }
            });
            $.modal.close();
        });
    }

    rename_notebook() {
        //
        // display rename notebook popup
        //
        let name = this.get_selected_notebook_name();
        $("#notebook_rename_popup .notebook_rename_popup_nb_name").html(name);
        $("#notebook_rename_popup input").val(name);
        $("#notebook_rename_popup").modal({ fadeDuration: 100 });

        // cancel button close modal:
        $("#notebook_rename_popup .button_Cancel").on("click", () => {
            $.modal.close();
        });

        // Set focus
        $("#notebook_rename_popup").on($.modal.OPEN, function (event, modal) {
            $('#notebook_rename_popup input').focus();
        });


        // unregister events after modal is closed.
        $("#notebook_rename_popup").on($.modal.CLOSE, function (event, modal) {
            $("#notebook_rename_popup").find("*").off();
            $("#notebook_rename_popup").off();
        });

        // Rename button renames:
        $("#notebook_rename_popup .button_OK").on("click", () => {
            let notebook_id = this.get_selected_notebook_id();
            $.ajax({
                url: '/joplin/notebooks/' + notebook_id + "/rename/",
                type: 'post',
                data: JSON.stringify({ "title": $('#notebook_rename_popup input').val() }),
                headers: { "X-CSRFToken": csrftoken },
                complete: () => {
                    this.set_sync_dirty();
                    this.reselect_after_reload = 2;
                    this.reload();
                }
            });
            $.modal.close();
        });
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
        this.sync_ongoing = null;
        this.pause = false;
        this.poll();
    }
    
    /**
     *
     */
    poll() {
        $.getJSON(
        '/joplin/sync/',
        (data) => { this.process_sync_data(data["info"]);
                    $("#synch_output_out").html(data["output"].replace(/\n/g, "<br />"));
                    $("#synch_output_err").html(data["error"].replace(/\n/g, "<br />"));
                }
        ).fail(() => {
            console.log("error while getting sync data");
        });
        
        if (this.enable == true) {
            setTimeout(() => { this.poll(); }, 3000);
        }
    }

    /**
     * We don't pause the polling, but stop emitting the polling result.
     */
    pause_emit() {
        this.pause = true;
    }
    
    /**
     * resume emitting polling info.
     */
    resume_emit() {
        this.pause = false;
    }
     
    /**
     *
     */
    process_sync_data(data) {
        if (data == "ongoing") {
            if ((this.sync_ongoing == null) || (this.sync_ongoing == false)) {
                this.sync_ongoing = true;
                if (this.pause == false) {
                    super.emit('sync_started')
                }
            }
        }
        else {
            if ((this.sync_ongoing == null) || (this.sync_ongoing == true)) {
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