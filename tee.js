/**
 * Created by Elmar <e.abdurayimov@gmail.com> Abdurayimov
 * @copyright (C)Copyright 2015 elmar.eatech.org
 * Date: 11/17/15
 * Time: 2:16 PM
 */

var system = require('system');
var utils = require('utils');
var helpers = require('helpers');
var casper = require('casper');

if (system.args.length < 5) {
    console.info("One argument must be passed.");

    phantom.exit();
}

var params = {
    frontendUrl: 'https://teespring.com',
    apiHost: '{key}-dsn.algolia.net',
    apiURL: 'https://{host}/1/indexes/site_wide_search_index_production/query?{queryString}',
    getParams: {
        'X-Algolia-API-Key': '',
        'X-Algolia-Application-Id': '',
        'X-Algolia-TagFilters': '-relaunched'
    },
    postParams: {
        'query': '',
        'page': '',
        'hitsPerPage': 12,
        'attributesToRetrieve': encodeURIComponent('["name","url","tippingpoint","amount_ordered","primary_pic_url","secondary_pic_url","endcost","enddate"]')
    }
};

params.postParams['query'] = system.args[4];
params.postParams['page'] = system.args[5] || 1;

var casperOptions = {
    //verbose: true,
    //logLevel: "debug",
    pageSettings: {
        "userAgent": 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:40.0) Gecko/20100101 Firefox/40.1',
        "loadImages": false,
        "loadPlugins": false,
        "javascriptEnabled": true
    },
    viewportSize: {
        width: 1600,
        height: 4000
    }
};

casper.create(casperOptions);

casper.start(params.frontendUrl);

casper.then(function () {
    var ENV = this.evaluate(function () {
        return window.ENV;
    });

    params.getParams['X-Algolia-API-Key'] = ENV.PUBLICLY_SEARCHABLE_ALGOLIA_READ_KEY;
    params.getParams['X-Algolia-Application-Id'] = ENV.ALGOLIA_ID;

    params.apiHost = params.apiHost.replace('{key}', ENV.ALGOLIA_ID.toLowerCase());

    params.apiURL = params.apiURL
        .replace('{host}', params.apiHost)
        .replace('{queryString}', helpers.createQueryString(params.getParams));

    casper.thenOpen(params.apiURL, {
        method: 'POST',
        data: '{"params":"' + helpers.createQueryString(params.postParams) + '"}',
        headers: {
            'Content-type': 'application/x-www-form-urlencoded',
            'Host': params.apiHost,
            'Origin': params.frontendUrl,
            'Referer': params.frontendUrl + '/',
            'User-Agent': casperOptions.pageSettings.userAgent
        }
    });
});

casper.then(function () {
    utils.dump(this.getPageContent());
});

casper.run(function () {
    this.exit();
});