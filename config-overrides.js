module.exports = function override(config, env) {
    // Modify Webpack to use worker-loader for .js files inside web workers
    config.module.rules.push({
      test: /\.worker\.js$/,  
      use: { loader: 'worker-loader' }
    });

    config.resolve.fallback = {
      ...config.resolve.fallback, // Preserve existing fallbacks
      "path": false,
      "fs": false,
      "crypto": false
    };

    return config;
  };
