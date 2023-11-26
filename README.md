## MiniPush

A partial reimplementation of the [GRIP protocol](https://pushpin.org/docs/protocols/grip/) that Pushpin uses, trading complexity for a "happy path" approach that should fit most use cases in a fraction of the code and memory usage of Pushpin.

Implemented as a single Node.js application, easily packaged with Docker.

### Goals

- [ ] Support the Server Sent Events transport
- [ ] Support `Grip-Channel`
- [ ] Support `Grip-Sig` for security
- [ ] Work with existing Pushpin libraries
- [ ] Support medium traffic levels (eg. max ~2000 concurrent users)
- [ ] Support paged streaming, Sequence IDs and Reliability features
- [ ] Written as single Node.js application

### Non-goals

* Supporting large amounts of users (eg. 50 000 concurrent users)
* Supporting more than one running instance of MiniPush (ie. clustering)
* Supporting WebSocket