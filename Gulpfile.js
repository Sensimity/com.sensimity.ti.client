// Stash requires in variables
var gulp = require('gulp-help')(require('gulp')),
    $ = require('gulp-load-plugins')({
        pattern: [
            'gulp-*', 'gulp.*'
        ],
        rename: {}
    }),
    modules = require('require-dir')('./dev/gulp/tasks', { recurse: true }),
    config = require('./dev/gulp/config');

// set the default task
gulp.task('default', ['help']);

// include all other tasks
for(var i in modules) {
    modules[i](gulp, $, config);
}
