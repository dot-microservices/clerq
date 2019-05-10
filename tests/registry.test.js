'use strict';

const ServiceRegistry = require('../');

const name = Math.random().toString().replace('0.', '');
const port = Math.floor(Math.random() * 9999);
const registry = new ServiceRegistry({ expire: 5 });

afterAll(() => registry.stop());

test('new service', async () => {
    const up = await registry.up(name, port);
    expect(up).toBe(1);
});

test('check service', async () => {
    const service = await registry.get(name);
    expect(service).toBeTruthy();
});

test('list service', async () => {
    const services = await registry.all(name);
    expect(services.length).toBeTruthy();
});

test('all services', async () => {
    const services = await registry.services();
    expect(services.includes(name)).toBeTruthy();
});
