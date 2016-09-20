// == Clean Tasks == //
module.exports = function (gulp, $, config) {
    gulp.task('lint', function () {
        gulp.src(['lib-ng/**/*.js'])
            .pipe($.eslint())
            .pipe($.eslint.formatEach('compact', process.stderr));
    });
};
