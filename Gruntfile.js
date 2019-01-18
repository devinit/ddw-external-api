'use strict';

module.exports = function(grunt) {
    const pkg = grunt.file.readJSON('package.json');
    grunt.initConfig({

        copy: {
            dist: {
                files: [
                    {
                        dest: './dist/routes/',
                        src: [ './src/routes/**/*.html' ],
                        expand: true,
                        flatten: true
                    }
                ]
            }
        },

        clean: {
            build: [
                `./dist/`,
            ]
        }
    });

    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');

    grunt.registerTask('default', [ 'clean build' ]);
    grunt.registerTask(
        'clean build',
        'Cleans and copies the files to the dist directory.',
        [ 'clean:build', 'copy:dist' ]
    );
    grunt.registerTask('build', [ 'clean build' ]);
};
