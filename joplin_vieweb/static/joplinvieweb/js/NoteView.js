class NoteView {
    constructor() {
    }
  
    clear() {
        $("#note_view").removeClass("border_note");
        $("#note_view").html("");
        $(".note_view_header").html("...");
    }
}