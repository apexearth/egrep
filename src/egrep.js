const assert = require('assert')
const fs = require('fs')
const readline = require('readline')
const {Readable} = require('stream')
const {promisify} = require('util')
const globp = promisify(require('glob'))
const recursivep = promisify(require('recursive-readdir'))
const statp = promisify(fs.stat)

class Egrep extends Readable {
    /**
     * @param {string[]} files
     * @param {string} pattern
     * @param {boolean} [glob = false]
     * @param {boolean} [recursive = false]
     * @param {boolean} [ignoreCase = false]
     * @param {boolean} [objectMode = true]
     */
    constructor({
        files,
        pattern,
        glob = false,
        recursive = false,
        ignoreCase = false,
        objectMode = true,
    } = {}) {
        super({objectMode})

        this.files = files
        this.pattern = pattern

        this.glob = glob
        this.recursive = recursive
        this.ignoreCase = ignoreCase
        this.isObjectMode = objectMode
        this.validate()

        let regexOptions = ''
        if (this.ignoreCase) {
            regexOptions += 'i'
        }
        this.regex = new RegExp(this.pattern, regexOptions)
        this.started = false
    }

    validate() {
        assert(!(this.glob && this.recursive), 'Cannot use glob and recursive simultaneously')
        assert(Array.isArray(this.files) && this.files.length > 0, 'One or more files are required')
        assert(typeof this.pattern === 'string', 'One or more files are required')
    }

    _read(/*size*/) {
        if (!this.started) {
            this.started = true
            this.start()
        }
    }

    start() {
        this.files.reduce((promise, file) => (
            promise
                .then(() => this.lookupFiles(file))
                .then(files => this.grepFiles(files))
        ), Promise.resolve())
            .then(() => this.destroy()) // All done!
            .catch(err => this.destroy(err))
    }

    lookupFiles(file) {
        if (this.glob) {
            return globp(file, {nodir: true})
        } else if (this.recursive) {
            return recursivep(file)
        }
        return statp(file)
            .then(stat => stat.isFile() ? [file] : [])
    }

    grepFiles(files) {
        return files.reduce((promise, file) => (
            promise.then(() => this.grepFile(file))
        ), Promise.resolve())
    }

    grepFile(file) {
        return new Promise((resolve, reject) => {
            const stream = readline.createInterface({input: fs.createReadStream(file)})
            stream.on('line', line => this.grepFileLine(file, line))
            stream.on('error', err => {
                stream.removeAllListeners()
                reject(err)
            })
            stream.on('close', () => {
                stream.removeAllListeners()
                resolve()
            })
        })
    }

    grepFileLine(file, line) {
        if (this.regex.test(line)) {
            if (this.isObjectMode) {
                this.push({file, line})
            } else {
                this.push(`${file}:${line}\n`)
            }
        }
    }
}

function egrep(options) {
    return new Egrep(options)
}

module.exports = egrep
module.exports.Grep = Egrep
