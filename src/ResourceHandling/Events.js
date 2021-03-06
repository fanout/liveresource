var utils = require('utils');
var debug = require('console');

class Events {
    constructor() {
        this._events = {};
    }

    _getHandlersForType(type) {
        if (!(type in this._events)) {
            this._events[type] = [];
        }
        return this._events[type];
    }

    on(type, handler) {
        var handlers = this._getHandlersForType(type);
        handlers.push(handler);
    }

    off(type, handler = null) {
        if (handler != null) {
            var handlers = this._getHandlersForType(type);
            utils.removeFromArray(handlers, handler);
        } else {
            delete this._events[type];
        }
    }

    trigger(type, obj, ...args) {
        var handlers = this._getHandlersForType(type).slice();
        for (var i = 0, n = handlers.length; i < n; i++) {
            var handler = handlers[i];
            handler.apply(obj, args);
        }
    }
}

module.exports = Events;