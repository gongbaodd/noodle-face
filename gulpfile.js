/*global -$ */
'use strict';
// generated on 2015-04-11 using generator-gulp-webapp 0.3.0
var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var browserSync = require('browser-sync');
var reload = browserSync.reload;
var babel = require('gulp-babel');

gulp.task('styles', function () {
  return gulp.src('app/static/styles/main.scss')
    .pipe($.sourcemaps.init())
    .pipe($.sass({
      outputStyle: 'nested', // libsass doesn't support expanded yet
      precision: 10,
      includePaths: ['.'],
      onError: console.error.bind(console, 'Sass error:')
    }))
    .pipe($.postcss([
      require('autoprefixer-core')({browsers: ['last 1 version']})
    ]))
    .pipe($.sourcemaps.write())
    .pipe(gulp.dest('.tmp/static/styles'))
    .pipe(reload({stream: true}));
});

gulp.task('jshint', function () {
  return gulp.src('app/static/scripts/**/*.js')
    .pipe(reload({stream: true, once: true}))
    .pipe($.jshint())
    .pipe($.jshint.reporter('jshint-stylish'))
    .pipe($.if(!browserSync.active, $.jshint.reporter('fail')));
});

gulp.task('html', ['styles'], function () {
  var assets = $.useref.assets({searchPath: ['.tmp/static', 'app/static', '.']});

  return gulp.src('app/static/*.html')
    .pipe(assets)
    .pipe($.if('*.js', $.uglify()))
    .pipe($.if('*.css', $.csso()))
    .pipe(assets.restore())
    .pipe($.useref())
    .pipe($.if('*.html', $.minifyHtml({conditionals: true, loose: true})))
    .pipe(gulp.dest('dist/static'));
});

gulp.task('images', function () {
  return gulp.src('app/static/images/**/*')
    .pipe($.cache($.imagemin({
      progressive: true,
      interlaced: true,
      // don't remove IDs from SVGs, they are often used
      // as hooks for embedding and styling
      svgoPlugins: [{cleanupIDs: false}]
    })))
    .pipe(gulp.dest('dist/static/images'));
});

gulp.task('fonts', function () {
  return gulp.src(require('main-bower-files')({
    filter: '**/*.{eot,svg,ttf,woff,woff2}'
  }).concat('app/static/fonts/**/*'))
    .pipe(gulp.dest('.tmp/static/fonts'))
    .pipe(gulp.dest('dist/static/fonts'));
});

gulp.task('extras', function () {
  return gulp.src([
    'app/static/*.*',
    '!app/static/*.html'
  ], {
    dot: true
  }).pipe(gulp.dest('dist/static'));
});

gulp.task('clean', require('del').bind(null, ['.tmp', 'dist']));

gulp.task('bower',function(){
    gulp.src('bower_components').pipe(gulp.dest('.tmp/bower_components'))
});

gulp.task('serve', ['styles', 'fonts','bower'], function () {
  browserSync({
    notify: false,
    port: 9000,
    server: {
      baseDir: ['.tmp/static', 'app/static'],
      routes: {
        '/bower_components': 'bower_components',
        '/node_modules':'node_modules'
      }
    }
  });

  // watch for changes
  gulp.watch([
    'app/static/*.html',
    'app/static/scripts/**/*.js',
    'app/static/images/**/*',
    '.tmp/static/fonts/**/*'
  ]).on('change', reload);

  gulp.watch('app/static/styles/**/*.scss', ['styles']);
  gulp.watch('app/static/fonts/**/*', ['fonts']);
  gulp.watch('bower.json', ['wiredep', 'fonts']);
});

gulp.task('6to5',function(){
    gulp.src('app/*.js').pipe(babel()).pipe(gulp.dest('dist'));
});

// inject bower components
gulp.task('wiredep', function () {
  var wiredep = require('wiredep').stream;

  gulp.src('app/static/styles/*.scss')
    .pipe(wiredep({
      ignorePath: /^(\.\.\/)+/
    }))
    .pipe(gulp.dest('app/static/styles'));

  gulp.src('app/static/*.html')
    .pipe(wiredep({
      exclude: ['bootstrap-sass-official'],
      ignorePath: /^(\.\.\/)*\.\./
    }))
    .pipe(gulp.dest('app'));
});

gulp.task('build', [ 'html', 'images', 'fonts', 'extras','6to5'], function () {
  return gulp.src('dist/static/**/*').pipe($.size({title: 'build', gzip: true}));
});

gulp.task('watch',function() {
    gulp.watch('app/*.js',['6to5']);
})


gulp.task('default', ['clean'], function () {
  gulp.start('build');
});
