'use strict';

const ServiceRegistry = require('../');

const name = Math.random().toString().replace('0.', '');
const port = Math.floor(Math.random() * 9999);
const port2 = Math.floor(Math.random() * 9999);
const registry = new ServiceRegistry({ cache: 60000, expire: 5, pino: { level: 'debug' } });

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
