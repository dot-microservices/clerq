# clerq

a redis based minimalist service registry and service discovery

## Install

```bash
npm i --save clerq
```

You can also clone this repository and make use of it yourself.

```bash
git clone https://github.com/Dvs-Bilisim/clerq.git
cd clerq
npm i
npm test
```

Before running tests, please make sure that you have Redis available on localhost.
If you don't know how to do that temporarily, please use following command to run it via docker.

```bash
docker run -p 6379:6379 --name clerq_redis redis:4-alpine
```

## Configuration

- **cache       :** expiration value in milliseconds for service caching. it's disabled by default.
- **delimiter   :** delimiter between prefix and service name.
- **expire      :** expire for service registry records. it's disabled by default.
- **iface       :** optional. name of the network interface to get outer ip from
- **pino        :** options for pino logger. it's { "level": "error" } by default.
- **prefix      :** prefix for service names

## Methods

- **.up(service, [target]):** adds a new service instance
- **.down(service, [target]):** removes an existing service instance
- **.destroy(service):** removes an existing service completely
- **.get(service):** returns a random instance by service
- **.all(service):** returns all instances by service
- **.services():** returns list of all services
- **.isCached(service):** checks if service instance cached properly
- **.stop():** stops service registry

## Examples

```js
const ServiceRegistry = require('clerq');
const Redis = require('redis');

const registry = new ServiceRegistry(redis.createClient(), {});

registry.up('test', 8000).then(console.log).catch(console.log);
registry.down('test', 8000).then(console.log).catch(console.log);
registry.get('test').then(console.log).catch(console.log);
registry.stop();
```
