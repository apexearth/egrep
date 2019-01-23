const fs = require('fs')
const glob = require('glob')

module.exports = (pattern, cb) => {
    fs.stat(pattern, (err, stats) => {
        if (err && err.code !== 'ENOENT') {
            return cb(err)
        }
        // Ensure we match all files within a directory if our glob *is* a directory.
        if (stats && stats.isDirectory()) {
            pattern += '/*'
        }
        // Ensure consistency in the output of relative paths. (strip ./)
        if (pattern.startsWith('./')) {
            pattern = pattern.slice(3)
        }
        glob(pattern, {nodir: true}, cb)
    })
}