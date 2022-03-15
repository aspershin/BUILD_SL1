let project_folder = "dist";
let source_folder = "src";

let path = {
    build: {
        html: project_folder + "/",
        css: project_folder + "/css/",
        js: project_folder + "/js/",
        img: project_folder + "/img/",
        fonts: project_folder + "/fonts/"
    },
    src: {
        pug: source_folder + "/pug/pages/*.pug",
        html: source_folder + "/*.html",
        css: source_folder + "/scss/style.scss",
        js: source_folder + "/js/script.js",
        img: source_folder + "/img/**/*.{jpg,png,svg,gif,ico,webp}",
        fonts: source_folder + "/fonts/*.ttf"
    },
    watch: {
        pug: source_folder + "/pug/**/*.pug",
        html: source_folder + "/**/*.html",
        css: source_folder + "/scss/**/*.scss",
        js: source_folder + "/js/**/*.js",
        img: source_folder + "/img/**/*.{jpg,png,svg,gif,ico,webp}",
    },
    clean: "./" + project_folder + "/"
}

let fs = require('fs');

let {src, dest} = require('gulp'),
    gulp = require('gulp'),
    browsersync = require('browser-sync').create(),
    del = require('del'),
    sass = require('gulp-sass')(require('sass')),
    autoprefixer = require('gulp-autoprefixer'),
    clean_css = require('gulp-clean-css'),
    rename = require('gulp-rename'),
    uglify = require('gulp-uglify-es').default,
    imagemin = require('gulp-imagemin'),
    svgSprite = require('gulp-svg-sprite'),
    ttf2woff = require('gulp-ttf2woff'),
    ttf2woff2 = require('gulp-ttf2woff2'),
    fonter = require('gulp-fonter'),
    group_media = require('gulp-group-css-media-queries'),
    pug = require('gulp-pug');

function browserSync(params) {
    browsersync.init({
        server: {
            baseDir: "./" + project_folder + "/"
        },
        port: 3000
    })
}

// function html() {
//     return gulp.src(path.src.html)
//         .pipe(dest(path.build.html))
//         .pipe(browsersync.stream())
// }

function css() {
    return gulp.src(path.src.css)
        .pipe(sass({
            outputStyle: "expanded"
        }).on('error', sass.logError))
        .pipe(
            group_media()
        )
        .pipe(
            autoprefixer({
                overrideBrowserslist: ["last 5 versions"],
                cascade: true
            })
        )
        .pipe(dest(path.build.css))
        .pipe(clean_css())
        .pipe(
            rename({
                extname: ".min.css"
            })
        )
        .pipe(dest(path.build.css))
        .pipe(browsersync.stream());
}

function js() {
    return gulp.src(path.src.js)
        .pipe(dest(path.build.js))
        .pipe(
            uglify()
        )
        .pipe(
            rename({
                extname: ".min.js"
            })
        )
        .pipe(dest(path.build.js))
        .pipe(browsersync.stream())
}

function watchFiles(params) {
    // gulp.watch([path.watch.html], html);
    gulp.watch([path.watch.pug], pug2html);
    gulp.watch([path.watch.css], css);
    gulp.watch([path.watch.js], js);
    gulp.watch([path.watch.img], images);
}

function clean(params) {
    return del(path.clean);
}

function images() {
    return src(path.src.img)
        .pipe(
            imagemin({
                progressive: true,
                svgoPlugins:[{removeViewBox: false}],
                interlaced: true,
                optimizationLevel: 3 // 0 to 7
            })
        )
        .pipe(dest(path.build.img))
        .pipe(browsersync.stream())
}

function fonts() {
    src(path.src.fonts)
        .pipe(ttf2woff())
        .pipe(dest(path.build.fonts));
    return src(path.src.fonts)
        .pipe(ttf2woff2())
        .pipe(dest(path.build.fonts));
}

function fontsStyle(params) {
    let file_content = fs.readFileSync(source_folder + '/scss/common/fonts.scss');
    if(file_content=='') {
        fs.writeFile(source_folder + '/scss/common/fonts.scss',' ',cb);
        return fs.readdir(path.build.fonts, function(err, items) {
            if(items) {
                let c_fontname;
                for(var i=0; i<items.length; i++) {
                    let fontname = items[i].split('.');
                    fontname = fontname[0];
                    if(c_fontname !=fontname) {
                        fs.appendFile(source_folder + '/scss/common/fonts.scss', '@include font("'+fontname + '", "'+fontname+ '", "400", "normal");\r\n', cb);
                    }
                    c_fontname = fontname;
                }
            }
        })
    }
}

function pug2html() {
    return gulp.src(path.src.pug)
        .pipe(pug({
            pretty: true
        }))
        .pipe(gulp.dest(path.build.html))
        .pipe(browsersync.stream())
}

function cb() {

}

gulp.task('svgSprite', function(){
    return gulp.src([source_folder + '/img/icons/svg/*.svg'])
        .pipe(svgSprite({
            mode: {
                stack: {
                    sprite: "../icons/svg/sprite.svg",
                    example: true
                }
            }
        }))
        .pipe(dest(path.build.img))
});

gulp.task('otf2ttf', function() {
    return src([source_folder + 'fonts/*.otf'])
        .pipe(fonter({
            formats: ['ttf']
        }))
        .pipe(dest(source_folder + '/fonts'));
});


let build = gulp.series(clean, gulp.parallel(js, css, images, fonts, pug2html), fontsStyle); //html
let watch = gulp.parallel(build, watchFiles, browserSync);

exports.pug2html = pug2html;
exports.fontsStyle = fontsStyle;
exports.fonts = fonts;
exports.images = images;
exports.js = js;
exports.css = css;
// exports.html = html;
exports.build = build;
exports.watch = watch;
exports.default = watch;