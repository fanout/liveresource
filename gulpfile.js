'use strict';

var gulp = require('gulp');
var gutil = require('gulp-util');

var doBuild = function(options) {
    var browserify = require('browserify');
    var source = require('vinyl-source-stream');
    var buffer = require('vinyl-buffer');
    var uglify = require('gulp-uglify');
    var sourcemaps = require('gulp-sourcemaps');
    var aliasify = require('aliasify');
    var babelify = require('babelify');
    var header = require('gulp-header');

    var debug = options.debug;
    var entryPoint = options.entryPoint;
    var expose = options.expose;
    var fileNameBase = options.fileNameBase;

    // Build banner
    var pkg = require('./package.json');
    var banner = ['/*!',
        ' * <%= pkg.description %> v<%= pkg.version %>',
        ' * (c) <%= pkg.author %> - <%= pkg.homepage %>',
        ' * License: <%= pkg.licenses[0].type %> (<%= pkg.licenses[0].url %>)',
        ' */',
    ''].join('\n');
    
    var headerTask = header(banner, { pkg: pkg });

    // output file name
    var outputFileName = fileNameBase + '-latest' + (debug ? '' : '.min') + '.js';

    // set up the browserify instance on a task basis
    var b = browserify({ debug: debug, standalone: expose, paths: [ './node_modules', './src', './lib' ] });
    b.transform(babelify);
    b.require(require.resolve(entryPoint), { entry: true })

    if (!debug) {
        var aliasifyOptions = { aliases: {
            'console': './src/no-console'
        }};
        b = b.transform(aliasify, aliasifyOptions);
    }

    var pipe = b.bundle()
        .on('error', gutil.log.bind(gutil, 'Browserify Error'))
        .pipe(source(outputFileName))
        .pipe(buffer());

    if (debug) {
        pipe = pipe.pipe(sourcemaps.init({loadMaps: true}));
    }

    if (!debug) {
        pipe = pipe.pipe(uglify());
    }

    return pipe
        .pipe(sourcemaps.write('./'))
        .pipe(headerTask)
        .pipe(gulp.dest('./build/output/'));
};

gulp.task('default', [ 'build-debug', 'build-min' ]);

gulp.task('build-debug', function () {
    return doBuild({entryPoint: './src/main.js', expose: 'LiveResource', fileNameBase: 'liveresource', debug: true});
});

gulp.task('build-min', function () {
    return doBuild({entryPoint: './src/main.js', expose: 'LiveResource', fileNameBase: 'liveresource', debug: false});
});

