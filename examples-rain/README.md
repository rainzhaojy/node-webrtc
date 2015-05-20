How to run examples
===================

node-webrtc目录examples下自带了例子bridge.js和peer.html, 演示了如何建立DataChannel进行通讯。

为了不修改examples目录里的文件，因此将examples/bridge.js, examples/peer.html两个文件copy到examples-rain目录，并做了下述修改:

- peer.html: call getUserMedia() in peer.html, and add the stream into PeerConnection
- bridge.js: remove DataChannel

You can run the demo by `node examples-rain/bridge.js` and browsing to `examples-rain/peer.html` in `chrome --enable-data-channels`.

usage:
------

``node examples/bridge.js [-h <host>] [-p <port>] [-ws <ws port>]``

options:

````
-h  host IP for the webserver that will serve the static files (default 127.0.0.1)
-p  host port for the webserver that will serve the static files (default 8080)
-ws port of the Web Socket server (default 9001)
````

If the bridge and peer are on different machines, you can pass the bridge address to the peer by:
````
http://<webserver>/peer.html?<sockertserver:port>
````
By default the bridge will be the same IP as the webserver and will listen on port 9001.
## bridge.js
You can run the data channel demo by `node examples/bridge.js` and browsing to `examples/peer.html` in `chrome --enable-data-channels`.

usage:
````
node examples/bridge.js [-h <host>] [-p <port>] [-ws <ws port>]
````
options:
````
-h  host IP for the webserver that will serve the static files (default 127.0.0.1)
-p  host port for the webserver that will serve the static files (default 8080)
-ws port of the Web Socket server (default 9001)
````

If the bridge and peer are on different machines, you can pass the bridge address to the peer by:
````
http://<webserver>/peer.html?<sockertserver:port>
````
By default the bridge will be the same IP as the webserver and will listen on port 9001.
