
"use strict";

var gulp = require("gulp");
var babel = require("gulp-babel");
var concat = require("gulp-concat");
var uglify = require('gulp-uglify');
var rename = require("gulp-rename");
var umd = require("gulp-umd");
var karma = require('karma').server;

var paths = {
  scriptSrc: "src/**/*.js"
};

/**
 * Build the dist files
 */
gulp.task("default", function () {
  return gulp.src(paths.scriptSrc)
    .pipe(concat("AudioFX.js"))
    .pipe(babel())
    .pipe(umd())
    .pipe(gulp.dest("dist"))
    .pipe(uglify())
    .pipe(rename("AudioFX.min.js"))
    .pipe(gulp.dest('dist'));
});

gulp.task('watch', function() {
  gulp.watch(paths.scriptSrc, ['default']);
});

/**
 * Run test once and exit
 */
gulp.task('test', function (done) {
  karma.start({
    configFile: __dirname + '/karma.conf.js',
    singleRun: true
  }, done);
});
