var gulp = require("gulp");
var gutil = require("gulp-util");
var clean = require("gulp-clean");
destination = "./build/";

var filesToMove = [
    "./**"
];

gulp.task("clean", function() {
    return gulp.src([destination], {read: false})
        .pipe(clean());
});

gulp.task("move", ["clean"], function() {
    gulp.src(filesToMove, {base: "adjuster/"})
        .pipe(gulp.dest(destination));
});

gulp.task("build", ["move"]);
