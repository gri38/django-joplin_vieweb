class NoteEditor {
    constructor() {
    }
    
    init() {
        this.easyMDE = new EasyMDE({
            element: $('#note_editor')[0],
            autofocus: true,
            indentWithTabs: false,
            uploadImage: true,
            imageUploadEndpoint: "note_edit/upload",
            imageCSRFToken: csrftoken,
            spellChecker: false,
            tabSize: 4,
            previewImagesInEditor: true,
            imagePathAbsolute: true
        });
    }
}
    
var editor = new NoteEditor();
$(window).on("load", () => { editor.init(); });