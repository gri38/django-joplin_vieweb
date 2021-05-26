
function display_progress(item) {
    item.addClass("center");
    item.html(' <span class="helper_vertical_align"></span><img style="height: 32px;" src="/static/joplinvieweb/img/progress.gif" />');
}

function clear_progress(item) {
    item.html('');
    item.removeClass("center");
}

function clear_note() {
    $("#note_view").removeClass("border_note");
    $("#note_view").html("");
    $(".note_view_header").html("...");
}

function display_notebooks_tree(data) {
    $('#notebooks_tree').tree({
        data: data,
        autoOpen: 1,
        autoEscape: false,
        closedIcon: $('<i class="fas fa-arrow-circle-right"></i>'),
        openedIcon: $('<i class="fas fa-arrow-circle-down"></i>')
    });
    
    // prevent unselection of notebook:
    $('#notebooks_tree').bind(
        'tree.click',
        function(e) {
            if ($('#notebooks_tree').tree('isNodeSelected', e.node)) {
                e.preventDefault();
            }
        }
    );
}

function get_notebooks_from_server() {
    $.getJSON(
    '/joplin/notebooks/',
    display_notebooks_tree
    )  .fail(function() {
    console.log("error while getting notebooks" );
    alert("Failed to get notebooks: click the notebook again.");
  });
}

function joplinvw_onload() {
    clear_note();
    get_notebooks_from_server();
}

function display_notebook_notes(data) {
    clear_progress($("#notes_list"));
    $("#notes_list").html(data);
}

function display_notebook(nb_id) {
    clear_note();
    display_progress($("#notes_list"));
    $.get(
    '/joplin/notebooks/' + nb_id + "/",
    display_notebook_notes
    )  .fail(function() {
        clear_progress($("#notes_list"));
        console.log("error while getting notes of notebook " + nb_id );
        $.get(
        '/joplin/notebooks/' + nb_id + "/error/",
        function(data) {$("#notes_list").html(data);}
        )
  });
}

function display_note_body(data, note_name) {
    clear_progress($("#note_view"));
    $(".note_view_header").html(note_name);
    $("#note_view").html(data);
    $("#note_view").addClass("border_note");
    if ($("#note_view").find(".toc").html().includes("li") == false) {
        $("#note_view").find(".toc").remove();
    }
    else {
        $("#note_view").find(".toc").append('<div class="toc_ctrl"><i onclick="toggle_toc(this);" class="fas fa-arrow-circle-down" /> <i onclick="$(\'.toc\').remove();" class="fas fa-times-circle" /></div>')
    }
}

function display_note_error(data, note_name) {
    clear_progress($("#note_view"));
    $(".note_view_header").html(note_name);
    $("#note_view").html(data);
    $("#note_view").addClass("border_note");
}

function toggle_toc(item_toggle) {
    $(item_toggle).toggleClass("fa-arrow-circle-down");
    $(item_toggle).toggleClass("fa-arrow-circle-right");
    
    $(".toc ul").fadeToggle();
}

function display_note(note_id, note_name) {
    clear_note();
    $(".note_item").removeClass("selected");
    $("#note_item_"+note_id).addClass("selected");
    display_progress($("#note_view"));
    
    $.get(
    '/joplin/notes/' + note_id + "/",
    function(data) { display_note_body(data, note_name); }
    )  .fail(function() {
        clear_progress($("#note_view"));
        console.log("error while getting note " + note_id );
        $.get(
            '/joplin/note/' + note_id + "/error/" + encodeURIComponent(note_name),
            function(data) {display_note_error(data, note_name);}
        )
  });
}