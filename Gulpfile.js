
"use strict";

var gulp = require("gulp");
var babel = require("gulp-babel");
var concat = require("gulp-concat");
var uglify = require('gulp-uglify');
var rename = require("gulp-rename");
var umd = require("gulp-umd");

gulp.task("default", function () {
  return gulp.src("src/**/*.js")
    .pipe(concat("AudioFX.js"))
    .pipe(babel())
    .pipe(umd())
    .pipe(gulp.dest("dist"))
    .pipe(uglify())
    .pipe(rename("AudioFX.min.js"))
    .pipe(gulp.dest('dist'));
});
