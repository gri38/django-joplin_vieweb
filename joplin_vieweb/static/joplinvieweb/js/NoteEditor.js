/**
 * Emit:
 *  - "cancel"
 *  - "commit"
 */
class NoteEditor extends EventEmitter {
    constructor(note_id, note_name, session_id) {
        super();
        this.note_id = note_id;
        if (note_name == null) {
            note_name = "Untitled"
        }
        this.note_name = note_name;
        this.session_id = session_id;
        this.notebook_id = null;

        this.render_timer = null;
        // console.log("Note editor created for note_id: [" + note_id + "] note name: [" + note_name + "] and session id: [" + session_id + "].");
    }

    /**
     * 
     * @param {} notebook_id Save the notebook id for note creation.
     */
    set_notebook_id(notebook_id) {
        this.notebook_id = notebook_id;
    }

    init(md) {
        md = md.replace(/\(:\//g, "(/joplin/:/");
        clear_progress($("#note_view"));
        $("#note_header_title").html('<input onfocus="$(this).select();" id="note_edit_title" type="text" value="' + this.note_name + '">');
        $("#note_view_header_right").append('<span id="note_edit_cancel" class="note_edit_icon icon-times-rectangle"></span><span id="note_edit_commit" class="note_edit_icon icon-check-square"></span>');
        $("#note_view").html('<textarea id="note_editor" name="note_editor">' + md + '</textarea>');
        this.easyMDE = new EasyMDE({
            element: $('#note_editor')[0],
            autofocus: true,
            indentWithTabs: false,
            uploadImage: true,
            imageUploadEndpoint: "note_edit/upload/" + this.session_id,
            imageCSRFToken: csrftoken,
            spellChecker: false,
            tabSize: 4,
            previewImagesInEditor: true,
            imagePathAbsolute: true,
            imageMaxSize: 1024*1024*1024*8, // 1GB
            showIcons: ["code", "table", ],
            toolbar: [  {
                          name: "bold",
                          action: EasyMDE.toggleBold,
                          className: "fa fa-bold",
                          title: "Bold",
                        },
                        {
                            name: "italic",
                            action: EasyMDE.toggleItalic,
                            className: "fa fa-italic",
                            title: "Italic",
                        }, 
                        {
                            name: "heading",
                            action: EasyMDE.toggleHeadingSmaller,
                            className: "fa fa-header",
                            title: "Heading",
                        },
                        '|',
                        {
                            name: "code",
                            action: EasyMDE.toggleCodeBlock,
                            className: "fa fa-code",
                            title: "Code",
                        },
                        {
                            name: "quote",
                            action: EasyMDE.toggleBlockquote,
                            className: "fa fa-quote-left",
                            title: "Quote",
                        },
                        {
                            name: "unordered-list",
                            action: EasyMDE.toggleUnorderedList,
                            className: "fa fa-list-ul",
                            title: "Generic List",
                        },
                        {
                            name: "ordered-list",
                            action: EasyMDE.toggleOrderedList,
                            className: "fa fa-list-ol",
                            title: "Numbered List",
                        },
                        '|',
                        {
                            name: "link",
                            action: EasyMDE.drawLink,
                            className: "fa fa-link",
                            title: "Create Link",
                        },
                        {
                            name: "image",
                            action: EasyMDE.drawImage,
                            className: "fa fa-picture-o",
                            title: "Insert Image",
                        },
                        {
                            name: "table",
                            action: EasyMDE.drawTable,
                            className: "fa fa-table",
                            title: "Insert Table",
                        },
                        '|',
                        {
                            name: "preview",
                            action: EasyMDE.togglePreview,
                            className: "fa fa-eye no-disable",
                            title: "Toggle Preview",
                        },
                        {
                            name: "side-by-side",
                            action: EasyMDE.toggleSideBySide,
                            className: "fa fa-columns no-disable no-mobile",
                            title: "Toggle Side by Side",
                        },
                        {
                            name: "fullscreen",
                            action: EasyMDE.toggleFullScreen,
                            className: "fa fa-arrows-alt no-disable no-mobile",
                            title: "Toggle Fullscreen",
                        },
                        '|',
                        {
                            name: "guide",
                            action: 'https://github.com/Ionaru/easy-markdown-editor',
                            className: "fa fa-question-circle",
                            title: "Markdown Guide",
                        },
                        {
                            name: "custom markdown guide",
                            action: 'https://facelessuser.github.io/pymdown-extensions/extensions/tabbed',
                            className: "fa fa-question-circle",
                            title: "Custom Markdown Guide",
                        }
                    ],
                    sideBySideFullscreen: false,
                    previewRender: this.preview_render
                });

        // attach to cancel and commit buttons.
        $("#note_edit_cancel").on("click", () => { super.emit("cancel"); });
        $("#note_edit_commit").on("click", () => {
            if (this.note_id != null){
                this.update_note(this.note_id, this.easyMDE.value());
            }
            else {
                this.create_note(this.easyMDE.value());
            }
        });
    }

    /**
     * 
     * 
     */
    preview_render(md, preview) { // Async method
        if (this.render_timer) {
            window.clearTimeout(this.render_timer);
        }
        this.render_timer = window.setTimeout(() => {
            this.render_timer = null;
            $.ajax({
                url: '/joplin/markdown_render/',
                type: 'post',
                headers: { "X-CSRFToken": csrftoken },
                data: JSON.stringify({ "markdown": md }),
                success: (data) => { preview.innerHTML = data; },
                error: () => {
                    preview.innerHTML = '<div><small style="color: darkred;">Error while rendering preview...<small></div>';
                }
            })
            return preview.innerHTML;
        }, 400); 
    }


    update_note(note_id, md) {
        md = md.replace(/\(\/joplin\/:\//g, "(:/");
        $.ajax({
            url: '/joplin/edit_session/' + this.session_id + '/update/' + this.note_id,
            type: 'post',
            headers: { "X-CSRFToken": csrftoken },
            data: JSON.stringify({ "markdown": md, "title": $("#note_edit_title").val() }),
            complete: () => { super.emit("commit"); }
        })
    }

    create_note(md) {
        md = md.replace(/\(\/joplin\/:\//g, "(:/");
        $.ajax({
            url: '/joplin/edit_session/' + this.session_id + '/create/' + this.notebook_id,
            type: 'post',
            headers: { "X-CSRFToken": csrftoken },
            data: JSON.stringify({ "markdown": md, "title": $("#note_edit_title").val() }),
            complete: (data) => {
                this.note_id = data.responseText;
                super.emit("commit");
            }
        })
    }
}