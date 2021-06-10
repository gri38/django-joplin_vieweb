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