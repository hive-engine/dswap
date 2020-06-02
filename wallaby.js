module.exports = function (wallaby) {

  return {
    files: [
      '!**/*.css',
      'src/**/*.ts',
      'src/**/*.html',
      'aurelia_project/environments/**/*.ts',      
      'tsconfig.json'
    ],

    tests: [
      //'test/unit/**/*.spec.ts'
    ],

    compilers: {
      '**/*.ts': wallaby.compilers.typeScript({ module: 'commonjs' })
    },

    env: {
      runner: 'node', 
      type: 'node'
    },

    testFramework: 'jest',

    debug: true
  };
};
