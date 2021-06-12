/**
 * WARNING: erase html content of given item.
 * And display a center gif for progress.
 * Use it when waiting for the html to set in item.
 */
function display_progress(item) {
    item.addClass("center");
    item.html('<span class="helper_vertical_align"></span><img style="height: 32px;" src="/static/joplinvieweb/img/progress.gif" />');
}

/**
 * WARNING clear html in item.
 * Call it after display progress when wait is over.
 */
function clear_progress(item) {
    item.html('');
    item.removeClass("center");
}

/**
 * https://betterprogramming.pub/how-to-create-your-own-event-emitter-in-javascript-fbd5db2447c4: thanks !
 */
class EventEmitter {
  constructor() {
    this._events = {};
  }

  on(name, listener) {
    if (!this._events[name]) {
      this._events[name] = [];
    }

    this._events[name].push(listener);
  }

  removeListener(name, listenerToRemove) {
    if (!this._events[name]) {
      throw new Error('Can\'t remove a listener. Event "${name}" doesn\'t exits.');
    }

    const filterListeners = (listener) => listener !== listenerToRemove;

    this._events[name] = this._events[name].filter(filterListeners);
  }

  emit(name, data) {
    if (!this._events[name]) {
      throw new Error('Can\'t emit an event. Event "${name}" doesn\'t exits.');
    }

    const fireCallbacks = (callback) => {
      callback(data);
    };

    this._events[name].forEach(fireCallbacks);
  }
}

function remove_css_file(filename){
    var allsuspects=document.getElementsByTagName("link")
    for (var i=allsuspects.length; i>=0; i--){ //search backwards within nodelist for matching elements to remove
    if (allsuspects[i] && allsuspects[i].getAttribute("href")!=null && allsuspects[i].getAttribute("href").indexOf(filename)!=-1)
        allsuspects[i].parentNode.removeChild(allsuspects[i]) //remove element by calling parentNode.removeChild()
    }
}

function load_css_file(filename){

    var fileref=document.createElement("link")
    fileref.setAttribute("rel", "stylesheet")
    fileref.setAttribute("type", "text/css")
    fileref.setAttribute("href", filename)

    if (typeof fileref!="undefined")
        document.getElementsByTagName("head")[0].appendChild(fileref)
}