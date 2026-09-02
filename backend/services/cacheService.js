const NodeCache = require('node-cache');

// StdTTL: 5 minutes default
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

const getFromCache = (key) => cache.get(key);
const setInCache = (key, value, ttl = 300) => cache.set(key, value, ttl);
const clearCacheKey = (key) => cache.del(key);
const clearCachePrefix = (prefix) => {
  const keys = cache.keys();
  for (const key of keys) {
    if (key.startsWith(prefix)) {
      cache.del(key);
    }
  }
};

module.exports = { getFromCache, setInCache, clearCacheKey, clearCachePrefix };
