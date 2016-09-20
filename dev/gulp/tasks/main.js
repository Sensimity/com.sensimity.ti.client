var runSequence = require('run-sequence');

// == Main Tasks == //
module.exports = function (gulp, $) {
    gulp.task('build', function (callback) {
        runSequence(
            'clean',
            'babel',
            callback
        );
    });

    gulp.task('watch', [
        'watch-babel',
        'watch-styles'
    ]);
};
