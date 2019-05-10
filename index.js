'use strict';

const ip = require('network-address');
const is = require('is_js');
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
                    if (this._options.debug) console.log(e.message);
                    reject(e);
                } else resolve(d);
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
                    if (this._options.debug) console.log(e.message);
                    reject(e);
                } else resolve(d);
            });
        });
    }

    /**
     * @description returns a random instance by service
     * @param {String} service name
     * @param {Boolean} skip pass true if you don't want to verify the address
     * @returns Promise
     * @memberof ServiceRegistry
     */
    get(service) { // ? skip
        // TODO: check if service is still available
        return new Promise((resolve, reject) => {
            if (is.not.string(service) || is.empty(service)) throw new Error('INVALID_SERVICE');

            const key = this._key(service);
            this._redis.srandmember(key, (e, d) => {
                if (this._options.expire) this._redis.expire(key, this._options.expire);
                if (is.error(e)) {
                    if (this._options.debug) console.log(e.message);
                    reject(e);
                } else resolve(d);
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
                    if (this._options.debug) console.log(e.message);
                    reject(e);
                } else resolve(d);
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
                    if (this._options.debug) console.log(e.message);
                    reject(e);
                } else {
                    const services = [];
                    if (is.array(d))
                        for (let service of d)
                            services.push(service.replace(this._key(), ''));
                    resolve(services);
                }
            });
        });
    }

    /**
     * @description stops service registry
     * @memberof ServiceRegistry
     */
    stop() {
        this._redis.quit();
        if (this._options.debug) console.log('service registry is down');
    }

    /**
     * @description builds address up
     * @private
     * @returns String | undefined
     * @memberof ServiceRegistry
     */
    _address(target) {
        if (is.number(target)) return `${ ip(this._options.iface) }:${ Math.abs(target) }`;
        else if (is.string(target)) {
            if (!target.includes(':')) {
                const port = parseInt(target);
                if (is.number(port)) return `${ ip(this._options.iface) }:${ Math.abs(port) }`;
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
