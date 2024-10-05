module.exports = function override(config, env) {
    // Modify Webpack to use worker-loader for .js files inside web workers
    config.module.rules.push({
      test: /\.worker\.js$/,  
      use: { loader: 'worker-loader' }
    });
  
    return config;
  };
  