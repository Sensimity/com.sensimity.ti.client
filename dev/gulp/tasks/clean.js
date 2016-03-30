// == Clean Tasks == //
module.exports = function (gulp, $, config) {
    gulp.task('clean', function () {
        return gulp.src(config.clean, {
                read: false
            })
            .pipe($.clean());
    });
};
