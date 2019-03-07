const assert = require('assert')
const fs = require('fs')
const readline = require('readline')
const {Readable} = require('stream')
const {promisify} = require('util')
const globp = promisify(require('glob'))
const recursivep = promisify(require('recursive-readdir'))
const statp = promisify(fs.stat)
const upath = require('upath')

class Egrep extends Readable {
    /**
     * @param {string[]} files
     * @param {string} pattern
     * @param {boolean} [glob = false]
     * @param {boolean} [recursive = false]
     * @param {boolean} [ignoreCase = false] Perform case insensitive matching.
     * @param {boolean} [excludes] An array of files or RegExp to ignore.
     * @param {boolean} [objectMode = true]
     * @param {boolean} [fullBinaryMatches = false] Display the full binary match.
     * @param {boolean} [hideBinaryMatches = false] Hide any binary matches.
     */
    constructor({
        files,
        pattern,
        glob = false,
        recursive = false,
        ignoreCase = false,
        excludes,
        objectMode = true,
        fullBinaryMatches = false,
        hideBinaryMatches = false,
    } = {}) {
        super({objectMode})

        this.processedFiles = []
        this.files = files
        this.pattern = pattern

        this.glob = glob
        this.recursive = recursive
        this.ignoreCase = ignoreCase
        this.excludes = excludes || []
        this.excludes = this.excludes.map(exclude => new RegExp(exclude))
        this.isObjectMode = objectMode
        this.fullBinaryMatches = fullBinaryMatches
        this.hideBinaryMatches = hideBinaryMatches
        this.validate()

        let regexOptions = ''
        if (this.ignoreCase) {
            regexOptions += 'i'
        }
        this.regex = new RegExp(this.pattern, regexOptions)
        this.started = false
    }

    validate() {
        assert(!(this.glob && this.recursive), 'Cannot use `glob` and `recursive` simultaneously')
        assert(Array.isArray(this.files) && this.files.length > 0, 'Missing required option: `files`')
        assert(this.pattern, 'Missing required option: `pattern`')

        assert(!this.excludes || (
            Array.isArray(this.excludes) &&
            !this.excludes.some(exclude => exclude.constructor !== RegExp)
        ), 'Invalid `excludes` received.')
        assert(typeof this.pattern === 'string' || this.pattern.constructor === RegExp, 'Invalid option: `pattern` must be a string or RegExp.')
        assert(!this.files.some(file => typeof file !== 'string'), 'Invalid option: `files` must be type `string[].`')
    }

    _read(/*size*/) {
        if (!this.started) {
            this.started = true
            this.start()
        }
    }

    async start() {
        try {
            for (let file of this.files) {
                const files = await this.lookupFiles(file)
                await this.grepFiles(files)
            }
        } catch (err) {
            this.emit('error', err)
        } finally {
            this.emit('close')
        }
    }

    async lookupFiles(file) {
        let files
        if (this.glob) {
            files = await globp(file, {nodir: true})
        } else {
            const stat = await statp(file)
            if (stat.isDirectory()) {
                if (this.recursive) {
                    files = await recursivep(file)
                } else {
                    throw Error(`${file}: Is a directory`)
                }
            } else if (stat.isFile()) {
                files = [file]
            } else {
                files = []
            }
        }
        return files.map(upath.normalize)
    }

    async grepFiles(files) {
        const files2 = files
            .filter(file => (
                !this.processedFiles.includes(file) &&
                (!this.excludes || !this.excludes.some(exclude => exclude.test(file)))
            ))
        for (let file of files2) {
            await this.grepFile(file)
        }
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
                this.processedFiles.push(file)
                stream.removeAllListeners()
                resolve()
            })
        })
    }

    grepFileLine(file, line) {
        if (this.regex.test(line)) {
            if (this.hideBinaryMatches && /\000/.test(line)) {
                return
            } else if (!this.fullBinaryMatches && /\000/.test(line)) {
                line = 'Binary content match.'
            }
            if (this.isObjectMode) {
                this.push({file, line})
            } else {
                if (this.recursive || this.glob) {
                    this.push(`${file}:${line}\n`)
                } else {
                    this.push(`${line}\n`)
                }
            }
        }
    }
}

function egrep(options, done) {
    let stream = new Egrep(options)
    if (typeof done === 'function') {
        let result = stream.isObjectMode ? [] : ''
        stream.on('data', data => {
            if (stream.isObjectMode) {
                result.push(data)
            } else {
                result += data
            }
        })
        stream.on('error', err => {
            stream.removeAllListeners()
            done(err)
        })
        stream.on('close', () => done(null, result))
    }
    return stream
}

module.exports = egrep
module.exports.Grep = Egrep
