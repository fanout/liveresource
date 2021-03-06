var utils = require('utils');
var debug = require('console');
var Pollymer = require('Pollymer');

var ValueResource = require('Aspects/Value/Engine/ValueResource');
var Connection = require('Engine/Connection');

class MultiplexWaitConnection extends Connection {
    constructor(engine, endpoint, engineUnit) {
        super(engine);

        this.uri = endpoint.endpointUri;
        this.request = new Pollymer.Request();
        this.resItems = endpoint.items.slice();
        this.isActive = false;

        this.request.on("finished", (code, result, headers) => {
            this.isActive = false;

            if (code >= 200 && code < 300) {

                utils.forEachOwnKeyValue(result, (uri, item) => {

                    debug.info(`got data for uri: ${uri}`);
                    var absoluteUri = utils.toAbsoluteUri(this.uri, uri);
                    ValueResource.updateValueItemMultiplex(engineUnit._resources, absoluteUri, item.headers, item.body);

                });

            }

            this._engine.update();
        });
    }

    hasChanged(endpoint) {
        var removedOrChanged = false;
        if (endpoint.items.length != this.resItems.length) {
            removedOrChanged = true
        } else {
            var preferredEndpointItemUris = [];
            var i;
            for (i = 0; i < endpoint.items.length; i++) {
                preferredEndpointItemUris.push(endpoint.items[i].uri);
            }
            preferredEndpointItemUris.sort();

            var pollResourceItemUris = [];
            for (i = 0; i < this.resItems.length; i++) {
                pollResourceItemUris.push(this.resItems[i].uri);
            }
            pollResourceItemUris.sort();

            for (i = 0; i < preferredEndpointItemUris.length; i++) {
                if (preferredEndpointItemUris[i] != pollResourceItemUris[i]) {
                    removedOrChanged = true;
                    break;
                }
            }
        }
        return removedOrChanged;
    }

    abort() {
        this.request.abort();
    }

    refresh(endpoint) {
        if (!this.isActive) {
            var urlSegments = [];
            for (var i = 0; i < this.resItems.length; i++) {
                var res = this.resItems[i];
                var uri = res.uri;
                urlSegments.push(`u=${encodeURIComponent(uri)}&inm=${encodeURIComponent(res.etag)}`);
            }
            var requestUri = `${this.uri}?${urlSegments.join('&')}`;

            debug.info(`Multiplex Wait Request URI: ${requestUri}`);
            this.request.start('GET', requestUri, {
                'Wait': 55
            });
            this.isActive = true;
        }
    }
}

module.exports = MultiplexWaitConnection;