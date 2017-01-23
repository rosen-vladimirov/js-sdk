import { KinveyError } from './errors';
import { Log, isDefined } from './utils';
import { CacheRequest, RequestMethod } from './request';
import localStorage from 'local-storage';
import Promise from 'es6-promise';
import url from 'url';
import assign from 'lodash/assign';
import isString from 'lodash/isString';
import isNumber from 'lodash/isNumber';
const usersNamespace = process.env.KINVEY_USERS_NAMESPACE || 'user';
const activeUserCollectionName = process.env.KINVEY_USER_ACTIVE_COLLECTION_NAME || 'kinvey_active_user';
const defaultTimeout = process.env.KINVEY_DEFAULT_TIMEOUT || 60000;

/**
 * The Client class stores information about your application on the Kinvey platform. You can create mutiple clients
 * to send requests to different environments on the Kinvey platform.
 */
export class Client {
  /**
   * Creates a new instance of the Client class.
   *
   * @param {Object}    options                                            Options
   * @param {string}    [options.apiHostname='https://baas.kinvey.com']    Host name used for Kinvey API requests
   * @param {string}    [options.micHostname='https://auth.kinvey.com']    Host name used for Kinvey MIC requests
   * @param {string}    [options.appKey]                                   App Key
   * @param {string}    [options.appSecret]                                App Secret
   * @param {string}    [options.masterSecret]                             App Master Secret
   * @param {string}    [options.encryptionKey]                            App Encryption Key
   * @param {string}    [options.appVersion]                               App Version
   * @return {Client}                                                      An instance of the Client class.
   *
   * @example
   * var client = new Kinvey.Client({
   *   appKey: '<appKey>',
   *   appSecret: '<appSecret>'
   * });
   */
  constructor(options = {}) {
    options = assign({
      apiHostname: 'https://baas.kinvey.com',
      micHostname: 'https://auth.kinvey.com',
      liveServiceHostname: 'https://kls.kinvey.com'
    }, options);

    if (options.apiHostname && isString(options.apiHostname)) {
      const apiHostnameParsed = url.parse(options.apiHostname);
      options.apiProtocol = apiHostnameParsed.protocol || 'https:';
      options.apiHost = apiHostnameParsed.host;
    }

    if (options.micHostname && isString(options.micHostname)) {
      const micHostnameParsed = url.parse(options.micHostname);
      options.micProtocol = micHostnameParsed.protocol || 'https:';
      options.micHost = micHostnameParsed.host;
    }

    if (options.liveServiceHostname && isString(options.liveServiceHostname)) {
      const liveServiceHostnameParsed = url.parse(options.liveServiceHostname);
      options.liveServiceProtocol = liveServiceHostnameParsed.protocol || 'https:';
      options.liveServiceHost = liveServiceHostnameParsed.host;
    }

    /**
     * @type {string}
     */
    this.apiProtocol = options.apiProtocol;

    /**
     * @type {string}
     */
    this.apiHost = options.apiHost;

    /**
     * @type {string}
     */
    this.micProtocol = options.micProtocol;

    /**
     * @type {string}
     */
    this.micHost = options.micHost;

    /**
     * @type {string}
     */
    this.liveServiceProtocol = options.liveServiceProtocol;

    /**
     * @type {string}
     */
    this.liveServiceHost = options.liveServiceHost;

    /**
     * @type {?string}
     */
    this.appKey = options.appKey;

    /**
     * @type {?string}
     */
    this.appSecret = options.appSecret;

    /**
     * @type {?string}
     */
    this.masterSecret = options.masterSecret;

    /**
     * @type {?string}
     */
    this.encryptionKey = options.encryptionKey;

    /**
     * @type {?string}
     */
    this.appVersion = options.appVersion;

    /**
     * @type {?string}
     */
    this.keychainAccessGroup = options.keychainAccessGroup;

    /**
     * @type {?number}
     */
    this.defaultTimeout = isDefined(options.defaultTimeout) ? options.defaultTimeout : defaultTimeout;
  }

  get activeUser() {
    return this._activeUser;
  }

  /**
   * API host name used for Kinvey API requests.
   */
  get apiHostname() {
    return url.format({
      protocol: this.apiProtocol,
      host: this.apiHost
    });
  }

  /**
   * @deprecated Use apiHostname instead of this.
   */
  get baseUrl() {
    return this.apiHostname;
  }

  /**
   * @deprecated Use apiProtocol instead of this.
   */
  get protocol() {
    return this.apiProtocol;
  }

  /**
   * @deprecated Use apiHost instead of this.
   */
  get host() {
    return this.apiHost;
  }

  /**
   * Mobile Identity Connect host name used for MIC requests.
   */
  get micHostname() {
    return url.format({
      protocol: this.micProtocol,
      host: this.micHost
    });
  }


  /**
   * Live Service host name used for streaming data.
   */
  get liveServiceHostname() {
    return url.format({
      protocol: this.liveServiceProtocol,
      host: this.liveServiceHost
    });
  }

  /**
   * The version of your app. It will sent with Kinvey API requests
   * using the X-Kinvey-Api-Version header.
   */
  get appVersion() {
    return this._appVersion;
  }

  /**
   * Set the version of your app. It will sent with Kinvey API requests
   * using the X-Kinvey-Api-Version header.
   *
   * @param  {String} appVersion  App version.
   */
  set appVersion(appVersion) {
    if (appVersion && !isString(appVersion)) {
      appVersion = String(appVersion);
    }

    this._appVersion = appVersion;
  }

  get keychainAccessGroup() {
    return this._keychainAccessGroup;
  }

  set keychainAccessGroup(accessGroup) {
    if (isDefined(accessGroup) && isString(accessGroup) === false) {
      throw new KinveyError('Keychain accessGroup is not a string. It must be a string value.');
    }

    this._keychainAccessGroup = accessGroup;
  }

  get defaultTimeout() {
    return this._defaultTimeout;
  }

  set defaultTimeout(timeout) {
    timeout = parseInt(timeout, 10);

    if (isNumber(timeout) === false || isNaN(timeout)) {
      throw new KinveyError('Invalid timeout. Timeout must be a number.');
    }

    if (timeout < 0) {
      Log.info(`Default timeout is less than 0. Setting default timeout to ${defaultTimeout}ms.`);
      timeout = defaultTimeout;
    }

    this._defaultTimeout = timeout;
  }

  loadActiveUser() {
    const request = new CacheRequest({
      method: RequestMethod.GET,
      url: url.format({
        protocol: this.protocol,
        host: this.host,
        pathname: `/${usersNamespace}/${this.appKey}/${activeUserCollectionName}`
      })
    });
    return request.execute()
      .then(response => response.data)
      .then((users) => {
        if (users.length > 0) {
          return users[0];
        }

        // Try local storage (legacy)
        return this.loadActiveUserLegacy();
      })
      .catch(() => null);
  }

  loadActiveUserLegacy() {
    return this.getActiveUserLegacy();
  }

  getActiveUserLegacy() {
    try {
      return localStorage.get(`${this.appKey}kinvey_user`);
    } catch (error) {
      return null;
    }
  }

  setActiveUser(user) {
    let promise = Promise.resolve(null);

    if (isDefined(this.activeUser)) {
       // Delete from cache
      const request = new CacheRequest({
        method: RequestMethod.DELETE,
        url: url.format({
          protocol: this.protocol,
          host: this.host,
          pathname: `/${usersNamespace}/${this.appKey}/${activeUserCollectionName}/${this.activeUser._id}`
        })
      });
      promise = request.execute()
        .then(() => {
          // Delete from memory
          this._activeUser = null;

          // Delete from local storage (legacy)
          this.setActiveUserLegacy(null);
        });
    }

    return promise
      .then(() => {
        if (isDefined(user) === false) {
          return null;
        }

        // Save to memory
        this._activeUser = user;

        // Save to local storage (legacy)
        this.setActiveUserLegacy(user);

        // Save to cache
        const request = new CacheRequest({
          method: RequestMethod.POST,
          url: url.format({
            protocol: this.protocol,
            host: this.host,
            pathname: `/${usersNamespace}/${this.appKey}/${activeUserCollectionName}`
          }),
          body: user
        });
        return request.execute()
          .then(response => response.data);
      })
      .then(() => user);
  }

  setActiveUserLegacy(user) {
    try {
      localStorage.remove(`${this.appKey}kinvey_user`);

      if (isDefined(user)) {
        localStorage.set(`${this.appKey}kinvey_user`, user);
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Returns an object containing all the information for this Client.
   *
   * @return {Object} Object
   */
  toPlainObject() {
    return {
      apiHostname: this.apiHostname,
      apiProtocol: this.apiProtocol,
      apiHost: this.apiHost,
      micHostname: this.micHostname,
      micProtocol: this.micProtocol,
      micHost: this.micHost,
      liveServiceHostname: this.liveServiceHostname,
      liveServiceHost: this.liveServiceHost,
      liveServiceProtocol: this.liveServiceProtocol,
      appKey: this.appKey,
      appSecret: this.appSecret,
      masterSecret: this.masterSecret,
      encryptionKey: this.encryptionKey,
      appVersion: this.appVersion,
      keychainAccessGroup: this.keychainAccessGroup
    };
  }

  /**
   * Initializes the Client class by creating a new instance of the
   * Client class and storing it as a shared instance.
   *
   * @deprecated Use `Client.initialize` instead.
   *
   * @param {Object}    options                                            Options
   * @param {string}    [options.apiHostname='https://baas.kinvey.com']    Host name used for Kinvey API requests
   * @param {string}    [options.micHostname='https://auth.kinvey.com']    Host name used for Kinvey MIC requests
   * @param {string}    [options.appKey]                                   App Key
   * @param {string}    [options.appSecret]                                App Secret
   * @param {string}    [options.masterSecret]                             App Master Secret
   * @param {string}    [options.encryptionKey]                            App Encryption Key
   * @param {string}    [options.appVersion]                               App Version
   * @return {Client}                                                      An instance of Client.
   *
   * @example
   * var client = Kinvey.Client.init({
   *   appKey: '<appKey>',
   *   appSecret: '<appSecret>'
   * });
   * Kinvey.Client.sharedInstance === client; // true
   */
  static init(options) {
    const client = new this(options);
    this._sharedInstance = client;
    return client;
  }

  /**
   * Initializes the Client class by creating a new instance of the
   * Client class and storing it as a shared instance. The returned promise
   * resolves with the shared instance of the Client class.
   *
   * @param {Object}    options                                            Options
   * @param {string}    [options.apiHostname='https://baas.kinvey.com']    Host name used for Kinvey API requests
   * @param {string}    [options.micHostname='https://auth.kinvey.com']    Host name used for Kinvey MIC requests
   * @param {string}    [options.appKey]                                   App Key
   * @param {string}    [options.appSecret]                                App Secret
   * @param {string}    [options.masterSecret]                             App Master Secret
   * @param {string}    [options.encryptionKey]                            App Encryption Key
   * @param {string}    [options.appVersion]                               App Version
   * @return {Promise}                                                     A promise.
   */
  static initialize(options) {
    const client = new this(options);
    this._sharedInstance = client;
    return client;
  }

  /**
   * Returns the shared instance of the Client class used by the SDK.
   *
   * @throws {KinveyError} If a shared instance does not exist.
   *
   * @return {Client} The shared instance.
   *
   * @example
   * var client = Kinvey.Client.sharedInstance;
   */
  static get sharedInstance() {
    if (isDefined(this._sharedInstance) === false) {
      throw new KinveyError('You have not initialized the library. ' +
        'Please call Kinvey.init() to initialize the library.');
    }

    return this._sharedInstance;
  }
}
