/**
 * Created by Elmar <e.abdurayimov@gmail.com> Abdurayimov
 * @copyright (C)Copyright 2015 elmar.eatech.org
 * Date: 11/18/15
 * Time: 4:54 PM
 */

module.exports = {
    createQueryString: function (data) {
        return Object.keys(data)
            .map(function (key) {
                return [key, data[key]]
                    .map(encodeURIComponent)
                    .join("=");
            })
            .join("&");
    }
};