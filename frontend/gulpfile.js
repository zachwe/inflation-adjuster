var gulp = require("gulp");
var browserify = require("browserify");
var transform = require("vinyl-transform");
destination = "../listentogithub/public/javascripts";

gulp.task("browserify", [], function() {
    /*
    return gulp.src
    var bundler = browserify({debug: true});
    bundler.add('./main.js');
    var dest = gulp.dest(destination);
    return bundler.bundle()
                  .pipe(dest);*/
    var browserified = transform(function(filename) {
        var b = browserify(filename);
        return b.bundle();
    });
    return gulp.src(['main.js'])
        .pipe(browserified)
        .pipe(gulp.dest(destination));
});

gulp.task("build", ["browserify"]);
