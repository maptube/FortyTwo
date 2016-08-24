module.exports = function(grunt) {

  //use: grunt connect
  //which runs the web server

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      build: {
        src: 'src/<%= pkg.name %>.js',
        dest: 'build/<%= pkg.name %>.min.js'
      }
    },
	connect: {
		server: {
			options: {
				port: 8000,
				hostname: '*',
				keepalive: true,
				open: {
					target: 'http://localhost:8000/42-threejs-2.html'
				}
			}
		}
	}
  });

  
  
  // Load the plugin that provides the "uglify" task.
  //grunt.loadNpmTasks('grunt-contrib-uglify');

  // Default task(s).
  //grunt.registerTask('default', ['uglify']);
  
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.registerTask('default', 'connect:server');

};