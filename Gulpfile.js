//var gulp = require('gulp');
//var babel = require('gulp-babel');
//
//gulp.task('default', function () {
//  return gulp.src('src/audioFX.js')
//    .pipe(babel())
//    .pipe(gulp.dest('dist'));
//});


var gulp = require("gulp");
var sourcemaps = require("gulp-sourcemaps");
var babel = require("gulp-babel");
var concat = require("gulp-concat");

gulp.task("default", function () {
  return gulp.src("src/**/*.js")
    .pipe(sourcemaps.init())
    .pipe(concat("audioFX.js"))
    .pipe(babel())
    .pipe(sourcemaps.write("."))
    .pipe(gulp.dest("dist"));
});
