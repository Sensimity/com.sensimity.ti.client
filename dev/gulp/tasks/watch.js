// == Watch Tasks == //
module.exports = function (gulp, $, config) {
    gulp.task('watch-babel', function () {
        $.watch([config.sourceDir + '/*.js', config.sourceDir + '/**/*.js'])
            .pipe($.babel({
                plugins: ['transform-object-assign'],
                presets: ['es2015']
            }))
            .pipe(gulp.dest(config.destinationDir));
    });
};
