'use strict';

const ip = require('ip');
const is = require('is_js');
const pino = require('pino');
const redis = require('redis');

/**
 * @description Redis based service registry & service discovery
 * @class ServiceRegistry
 */
class ServiceRegistry {
    /**
     *Creates an instance of ServiceRegistry.
     * @param {Object} options registry options
     * @memberof ServiceRegistry
     */
    constructor(options) {
        if (is.not.undefined(options) && is.not.object(options))
            throw new Error('invalid options');

        this._options = Object.assign({ prefix: 'clerq' }, options || {});

        this._cache = {};
        this._logger = pino(Object.assign({ level: 'error' }, is.object(this._options.pino) ? this._options.pino : {}));
        this._redis = redis.createClient(this._options.port, this._options.host, this._options.redis);
    }

    /**
     * @description adds a new service instance
     * @param {String} service name
     * @param {String | Number} target address
     * @returns Promise
     * @memberof ServiceRegistry
     */
    up(service, target) {
        return new Promise((resolve, reject) => {
            if (is.not.string(service) || is.empty(service)) throw new Error('INVALID_SERVICE');

            const address = this._address(target), key = this._key(service);
            this._redis.sadd(key, address, (e, d) => {
                if (this._options.expire) this._redis.expire(key, this._options.expire);
                if (is.error(e)) {
                    this._logger.error(e, 'clerq.up');
                    reject(e);
                } else {
                    this._logger.info({ service, address, d }, 'clerq.up');
                    resolve(d);
                }
            });
        });
    }

    /**
     * @description removes an existing service instance
     * @param {String} service name
     * @param {String | Number} target address
     * @returns Promise
     * @memberof ServiceRegistry
     */
    down(service, target) {
        return new Promise((resolve, reject) => {
            if (is.not.string(service) || is.empty(service)) throw new Error('INVALID_SERVICE');

            const address = this._address(target), key = this._key(service);
            this._redis.srem(key, address, (e, d) => {
                if (this._options.expire) this._redis.expire(key, this._options.expire);
                if (is.error(e)) {
                    this._logger.error(e, 'clerq.down');
                    reject(e);
                } else {
                    this._logger.info({ service, address, d }, 'clerq.down');
                    resolve(d);
                }
            });
        });
    }

    /**
     * @description removes an existing service completely
     * @param {String} service name
     * @returns Promise
     * @memberof ServiceRegistry
     */
    destroy(service) {
        return new Promise((resolve, reject) => {
            if (is.not.string(service) || is.empty(service)) throw new Error('INVALID_SERVICE');

            const key = this._key(service);
            this._redis.expire(key, 1, e => {
                if (is.error(e)) {
                    this._logger.error(e, 'clerq.destroy');
                    reject(e);
                } else {
                    this._logger.info({ service }, 'clerq.destroy');
                    resolve(true);
                }
            });
        });
    }

    /**
     * @description returns a random instance by service
     * @param {String} service name
     * @returns Promise
     * @memberof ServiceRegistry
     */
    get(service) {
        return new Promise((resolve, reject) => {
            if (is.not.string(service) || is.empty(service)) throw new Error('INVALID_SERVICE');
            else if (this.isCached(service)) return resolve(this._cache[service].d);

            const key = this._key(service);
            this._redis.srandmember(key, (e, d) => {
                if (this._options.expire) this._redis.expire(key, this._options.expire);
                if (is.error(e)) {
                    this._logger.error(e, 'clerq.get');
                    reject(e);
                } else {
                    if (is.number(this._options.cache) && this._options.cache > 0)
                        if (d) this._cache[service] = { d, t: Date.now() };
                    this._logger.info({ service, d }, 'clerq.get');
                    resolve(d);
                }
            });
        });
    }

    /**
     * @description returns all instances by service
     * @param {String} service name
     * @returns Promise
     * @memberof ServiceRegistry
     */
    all(service) {
        return new Promise((resolve, reject) => {
            if (is.not.string(service) || is.empty(service)) throw new Error('INVALID_SERVICE');

            const key = this._key(service);
            this._redis.smembers(key, (e, d) => {
                if (this._options.expire) this._redis.expire(key, this._options.expire);
                if (is.error(e)) {
                    this._logger.error(e, 'clerq.all');
                    reject(e);
                } else {
                    if (is.number(this._options.cache) && this._options.cache > 0)
                        if (is.array(d) && is.not.empty(d)) {
                            const address = d[ Math.floor(Math.random() * d.length) ];
                            this._cache[service] = { d: address, t: Date.now() };
                        }
                    this._logger.info({ service, d }, 'clerq.all');
                    resolve(d);
                }
            });
        });
    }

    /**
     * @description returns list of all services
     * @returns Promise
     * @memberof ServiceRegistry
     */
    services() {
        return new Promise((resolve, reject) => {
            this._redis.keys(`${ this._options.prefix }*`, (e, d) => {
                if (is.error(e)) {
                    this._logger.error(e, 'clerq.services');
                    reject(e);
                } else {
                    const services = [];
                    if (is.array(d))
                        for (let service of d)
                            services.push(service.replace(this._key(), ''));
                    this._logger.info(services, 'clerq.services');
                    resolve(services);
                }
            });
        });
    }

    /**
     * @description checks if service instance cached properly
     * @param {String} service
     * @returns {Boolean}
     * @memberof ServiceRegistry
     */
    isCached(service) {
        if (is.number(this._options.cache) && this._options.cache > 0 && is.existy(this._cache[service])) {
            const cached = this._cache[service];
            if (is.object(cached)) return Math.abs(Date.now() - cached.t) < this._options.cache;
        }
        return false;
    }

    /**
     * @description stops service registry
     * @memberof ServiceRegistry
     */
    stop() {
        this._redis.quit();
        this._logger.info('service registry is down');
    }

    /**
     * @description builds address up
     * @private
     * @returns String | undefined
     * @memberof ServiceRegistry
     */
    _address(target) {
        if (is.number(target)) return `${ ip.address() }:${ Math.abs(target) }`;
        else if (is.string(target)) {
            if (!target.includes(':')) {
                const port = parseInt(target);
                if (is.number(port)) return `${ ip.address() }:${ Math.abs(port) }`;
            } else return target;
        }
    }

    /**
     * @description builds key up
     * @private
     * @returns String
     * @memberof ServiceRegistry
     */
    _key(service) {
        const key = `${ this._options.prefix }${ this._options.delimiter || '::' }`;
        if (!service) return key;
        else return `${ key }${ service }`;
    }
}

module.exports = ServiceRegistry;
