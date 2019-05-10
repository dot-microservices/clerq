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

- **debug       :** Debug mode. It's disabled by default.
- **delimiter   :** Delimiter between prefix and service name.
- **expire      :** expire for service registry records. it's disabled by default.
- **host        :** redis hostname
- **port        :** redis port
- **prefix      :** prefix for service names
- **redis       :** options for redis instance ( please see <https://www.npmjs.com/package/redis> )
