'use strict';

var Stream = require('stream');
var gutil = require('gulp-util');
var path = require('path')
var slash = require('slash');
var PLUGIN_NAME = 'gulp-cordova-app-loader-manifest';


var calManifest = function calManifest(options) {
    options = options || {};

    options.prefixSplit = options.prefixSplit || '/';

    if (!options.load) {
        options.load = ['**'];
    } else if (!(options.load instanceof Array)) {
        options.load = [options.load];
    }

    var manifest = {
        files: {},
        load: [],
    };

    var stream = new Stream.Transform({objectMode: true});

    stream._transform = function (file, unused, done) {
        if (file.isNull() || !file.stat.isFile()) {
            return done();
        }

        if (file.isStream()) {
            this.emit('error', new gutil.PluginError(PLUGIN_NAME, 'Streams are not supported!'));
            return done();
        }

        var hasher = require('crypto').createHash('sha256');

        var fileRelative = path.relative(options.root,file.path);
        var filename = slash(fileRelative);
        var key = filename.replace(/\//g, '_');
        manifest.files[key] = {
            filename: filename,
            version: hasher.update(file.contents).digest('hex')
        };

        done();
    };

    stream._flush = function (done) {

        manifest.hash = new Date().getTime();

        var loads = [];

        var loaded = [];
        for(var i in manifest.files){
            var file = manifest.files[i].filename;

            for(var j in options.load){
                var glob = options.load[j];
                if(loaded.indexOf(file) > -1){
                    continue;
                }
                if(file.indexOf(glob) == 0){
                    if(!loads[j]){
                        loads[j] = [];
                    }
                    loaded.push(file);
                    loads[j].push(file);
                }
            }
        }

        for(var k in loads){
            manifest.load = manifest.load.concat(loads[k]);
        }




        var file = new gutil.File({
            path: 'manifest.json',
            contents: new Buffer(JSON.stringify(manifest, null, 4))
        });
        stream.push(file);
        return done();
    };


    return stream;
};

module.exports = calManifest;
