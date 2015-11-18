/**
 * Created by Elmar <e.abdurayimov@gmail.com> Abdurayimov
 * @copyright (C)Copyright 2015 elmar.eatech.org
 * Date: 11/17/15
 * Time: 2:16 PM
 */

var system  = require('system');
var utils   = require('utils');
var fs      = require('fs');
var helpers = require('helpers');

if (system.args.length < 5) {
    console.info("One argument must be passed.");

    phantom.exit();
}

var params = {
    minutesForUpdate: 360,
    frontendUrl     : 'https://teespring.com',
    apiHost         : '{key}-dsn.algolia.net',
    apiURL          : 'https://{host}/1/indexes/site_wide_search_index_production/query?{queryString}',
    getParams       : {
        'X-Algolia-API-Key'       : null,
        'X-Algolia-Application-Id': null,
        'X-Algolia-TagFilters'    : '-relaunched'
    },
    postParams      : {
        'query'               : '',
        'page'                : '',
        'hitsPerPage'         : 20,
        'attributesToRetrieve': "name,url,tippingpoint,amount_ordered,primary_pic_url,secondary_pic_url,endcost,enddate,objectID"
    }
};

var keysFile = 'keys.json';

params.postParams.query       = system.args[4];
params.postParams.page        = system.args[5] || 1;
params.postParams.hitsPerPage = system.args[6] || params.postParams.hitsPerPage;

var casperOptions = {
    //verbose: true,
    //logLevel: "debug",
    pageSettings: {
        "userAgent"        : 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:40.0) Gecko/20100101 Firefox/40.1',
        "loadImages"       : false,
        "loadPlugins"      : false,
        "javascriptEnabled": true
    },
    viewportSize: {
        width : 1600,
        height: 4000
    }
};

var casper = require('casper').create(casperOptions);

casper.start('127.0.0.1', function () {
    var requestNewKeys = false;
    var exists         = fs.exists(keysFile);

    if (exists) {
        var keys = require('keys.json');

        var keyLastUpdate = Math.floor((Date.now() - keys.apiKey.datetime) / 1000 / 60);
        var idLastUpdate  = Math.floor((Date.now() - keys.apiId.datetime) / 1000 / 60);

        if (keyLastUpdate > params.minutesForUpdate || idLastUpdate > params.minutesForUpdate) {
            requestNewKeys = true;
        }
    } else {
        requestNewKeys = true;
    }

    if (requestNewKeys) {
        casper.thenOpen(params.frontendUrl, function () {
            var ENV = this.evaluate(function () {
                return window.ENV;
            });

            fs.write(keysFile, JSON.stringify({
                'apiKey': {
                    value   : ENV.PUBLICLY_SEARCHABLE_ALGOLIA_READ_KEY,
                    datetime: Date.now()
                },
                'apiId' : {
                    value   : ENV.ALGOLIA_ID,
                    datetime: Date.now()
                }
            }), 'w');
        });
    }
});

casper.then(function () {
    var keys = require('keys.json');

    params.getParams['X-Algolia-API-Key']        = keys.apiKey.value;
    params.getParams['X-Algolia-Application-Id'] = keys.apiId.value;
});

casper.then(function () {
    params.apiHost = params.apiHost.replace('{key}', params.getParams['X-Algolia-Application-Id'].toLowerCase());

    params.apiURL = params.apiURL
        .replace('{host}', params.apiHost)
        .replace('{queryString}', helpers.createQueryString(params.getParams));

    casper.thenOpen(params.apiURL, {
        method: 'POST',
        data  : '{"params":"' + helpers.createQueryString(params.postParams) + '"}'
    });
});

casper.then(function () {
    utils.dump(this.getPageContent());
});

casper.run(function () {
    this.exit();
});