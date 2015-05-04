//var gulp = require('gulp');
//var babel = require('gulp-babel');
//
//gulp.task('default', function () {
//  return gulp.src('src/audioFX.js')
//    .pipe(babel())
//    .pipe(gulp.dest('dist'));
//});
"use strict";

var gulp = require("gulp");
var sourcemaps = require("gulp-sourcemaps");
var babel = require("gulp-babel");
var concat = require("gulp-concat");
var uglify = require('gulp-uglify');
var rename = require("gulp-rename");
var umd = require("gulp-umd");

gulp.task("default", function () {
  return gulp.src("src/**/*.js")
    .pipe(sourcemaps.init())
    .pipe(concat("audioFX.js"))
    .pipe(babel())
    .pipe(umd())
    .pipe(gulp.dest("dist"))
    .pipe(uglify())
    .pipe(sourcemaps.write("."))
    .pipe(rename("audioFX.min.js"))
    .pipe(gulp.dest('dist'));
});
