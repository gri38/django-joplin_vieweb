class NoteView {
    constructor() {
        this.current_note_id = null;
        this.current_note_name = null;
    }
  
    /**
     *
     */
    clear() {
        $("#note_view").removeClass("border_note");
        $("#note_view").html("");
        $(".note_view_header").html("...");
        this.current_note_id = null;
        this.current_note_name = null;
    }
    
    /**
     *
     */
    get_note(note_id, note_name) {
        this.clear();
        display_progress($("#note_view"));
        
        $.get(
        '/joplin/notes/' + note_id + "/",
        (data) => {
                    this.current_note_id = note_id;
                    this.current_note_name = note_name;
                    this.get_note_tags(note_id);
                    this.display_note(data, note_name);
                  }
        )  .fail(() => {
            clear_progress($("#note_view"));
            console.log("error while getting note " + note_id );
            $.get(
                '/joplin/note_error/',
                (data) => {
                        this.display_note_error(data, note_name);
                        $("#note_view").find(".icon-refresh").on("click", () => this.get_note(note_id, note_name) );
                    }
            )
      });  
    }
    
    /**
     *
     */
    display_note(data, note_name) {
        clear_progress($("#note_view"));
        $(".note_view_header").html(note_name);
        $("#note_view").html(data);
        $("#note_view").addClass("border_note");
        if ($("#note_view").find(".toc").html().includes("li") == false) {
            $("#note_view").find(".toc").remove();
        }
        else {
            $("#note_view").find(".toc").append('<div class="toc_ctrl"><span id="toggle_toc_btn"  class="icon-chevron-circle-down"></span> <span onclick="$(\'.toc\').remove();" class="icon-times-circle"></span>&nbsp;</div>');
            $("#note_view").find(".toc").prepend('<center style="display: none;" id="toc_title">Content</center>');
            let note_view_position = $('#note_view').position();
            $(".toc").css("top", "calc(" + note_view_position.top.toString() + "px + 0.8em + 17px)");
            $(".toc").css("right", "20px");
            $("#toggle_toc_btn").on("click", (ev) => this.toggle_toc(ev));
        }
        
        $('.toc').draggabilly({});
    }
    
    display_note_error(data, note_name) {
        clear_progress($("#note_view"));
        $(".note_view_header").html(note_name);
        $("#note_view").html(data);
        $("#note_view").addClass("border_note");
    }
    
    /**
     *
     */
    get_note_tags(note_id) {
        $.get(
            '/joplin/notes/' + note_id + "/tags",
            (data) => { this.display_note_tags(data); }
        ) ;
    }
    
    /**
     *
     */
    display_note_tags(data) {
        $("#note_view").prepend(data);
        if (data.includes(">public<")) {
            $("#note_tags").prepend('<a class="public_link" href="/joplin/notes/public/' + this.current_note_id + '" target="_blank"><span class="icon-link"></a>')
        }
    }
    
    /**
     *
     */
    toggle_toc(ev) {
        $(ev.currentTarget).toggleClass("icon-chevron-circle-down");
        $(ev.currentTarget).toggleClass("icon-chevron-circle-right");
        
        let state = $("#toc_title").css("display");
        if (state == "none") {
            $(".toc>ul").fadeToggle(function() {$("#toc_title").fadeToggle();});
        }
        else {
            $("#toc_title").fadeToggle(function() {$(".toc>ul").fadeToggle();});
        }
    }

}



