const isWin = process.platform === 'win32'
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
     * @param {boolean} [ignoreCase = false] Perform case insensitive matching.
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
        assert(Array.isArray(this.files) && this.files.length > 0, 'Missing required argument: files')
        assert(typeof this.pattern === 'string' || this.pattern.constructor === RegExp, 'Missing required argument: pattern')
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
            .then(() => this.emit('close')) // All done!
            .catch(err => this.emit('error', err))
    }

    lookupFiles(file) {
        if (this.glob) {
            return globp(file, {nodir: true})
        }
        return statp(file)
            .then(stat => {
                if (stat.isDirectory()) {
                    if (this.recursive) {
                        return recursivep(file)
                    } else {
                        throw Error(`${file}: Is a directory`)
                    }
                }
                return stat.isFile() ? [file] : []
            })
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
        if (isWin) {
            file = file.replace(/\\/g, '/')
        }
        if (this.regex.test(line)) {
            if (this.isObjectMode) {
                this.push({file, line})
            } else {
                if (this.recursive || this.glob) {
                    this.push(`${file}:${line}\n`)
                } else {
                    // Attempt to conform to the behavior of grep on the system.
                    if (process.platform === 'darwin' ||
                        process.platform === 'win32') {
                        this.push(`${line}\n`)
                    } else {
                        this.push(`${file}:${line}\n`)
                    }
                }
            }
        }
    }
}

function egrep(options) {
    return new Egrep(options)
}

module.exports = egrep
module.exports.Grep = Egrep
