'use strict';

const ServiceRegistry = require('../');

const name = Math.random().toString().replace('0.', '');
const port = Math.floor(Math.random() * 9999);
const port2 = Math.floor(Math.random() * 9999);
const registry = new ServiceRegistry({ cache: 60000, expire: 5, pino: { level: 'fatal' } });

afterAll(() => registry.stop());

test('new service', async () => {
    const up = await registry.up(name, port);
    expect(up).toBe(1);
});

test('yet another service', async () => {
    const up = await registry.up(name, port2);
    expect(up).toBe(1);
});

test('check service', async () => {
    const service = await registry.get(name);
    expect(service).toBeTruthy();
});

test('is cached', async () => {
    expect(registry.isCached(name)).toBeTruthy();
});

test('list service', async () => {
    const services = await registry.all(name);
    expect(services.length).toBe(2);
});

test('via cache', async () => {
    const service = await registry.get(name);
    expect(service).toBeTruthy();
});

test('all services', async () => {
    const services = await registry.services();
    expect(services.includes(name)).toBeTruthy();
});

test('destroy services', async () => {
    const service = await registry.destroy(name);
    expect(service).toBeTruthy();
});

const port3 = 8688;
test('find port', async () => {
    const taken = await registry.findPort(port3);
    expect(taken).toBe(port3);
});

test('claim port', async () => {
    const taken = await registry.findPort(port3, true);
    expect(taken).toBe(port3);
});

test('claim again', async () => {
    const taken = await registry.findPort(port3, true);
    expect(taken).toBe(port3 + 1);
});

test('release port', async () => {
    const taken = await registry.releasePort(port3);
    expect(taken).toBe(1);
});

test('release other port', async () => {
    const taken = await registry.releasePort(port3 + 1);
    expect(taken).toBe(1);
});

test('release unknown port', async () => {
    const taken = await registry.releasePort(port3 + 10);
    expect(taken).toBe(0);
});
