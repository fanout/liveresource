var utils = require('utils');
var debug = require('console');
var mapWebSocketUrls = require('utils.mapWebSocketUrls');

var ResourceHandler = require('ResourceHandling/ResourceHandler');

class Engine {
    constructor() {
        this._resourceHandlers = new Map();
        this._engineUnits = [];
        this._updatePending = false;

        this.options = {
            longPollTimeoutMsecs: 0,
            maxLongPollDelayMsecs: 0
        };
    }

    setGlobalOptions(options) {
        this.options = options;
    }

    getHandlerForUri(uri) {
        return this._resourceHandlers.getOrCreate(uri, () => new ResourceHandler(this, uri));
    }

    getResourceAspectsForInterestType(interestType) {
        var resourceAspects = [];
        for (let [uri, resourceHandler] of this._resourceHandlers) {
            var resourceAspect = resourceHandler.getResourceAspectForInterestType(interestType);
            if (resourceAspect != null) {
                resourceAspects.push(resourceAspect);
            }
        }
        return resourceAspects;
    }

    update() {
        if (this._updatePending) {
            // Do nothing if we already have a pending update,
            return;
        }
        this._updatePending = true;
        
        process.nextTick(() => {
            this._updatePending = false;

            // restart our long poll
            debug.info('engine: setup long polls');

            for(var i = 0; i < this._engineUnits.length; i++) {
                var engineUnit = this._engineUnits[i];
                engineUnit.update();
            }
        });
    }

    addEngineUnit(engineUnit) {
        this._engineUnits.push(engineUnit);
        engineUnit.engine = this;
    }

    findEngineUnitForEvent(eventName) {
        for (var i = 0; i < this._engineUnits.length; i++) {
            var engineUnit = this._engineUnits[i];
            if (utils.findInArray(engineUnit.events, eventName) >= 0) {
                return engineUnit;
            }
        }
        return null;
    }
}

module.exports = Engine;