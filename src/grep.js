const assert = require('assert')
const {Readable} = require('stream')
const glob = require('glob')

const readline = require('readline')
const fs = require('fs')

class Grep extends Readable {
    /**
     * @param options
     */
    constructor({
        recursive = false,
        files = []
    } = {}) {
        super()
        this.recursive = recursive
        this.files = files || []
        this.validate()

        this.pendingGlobs = this.files
        this.pendingGlobMatches = []
        this.currentGlob = null
        this.currentFiles = []
        this.currentFile = null
    }

    validate() {
        assert(this.files.length > 0, 'one or more files are required')
    }

    _read(size) {
        if (this.pendingGlobMatches.length === 0 && this.pendingGlobs.length > 0) {
            let pendingGlob = this.pendingGlobs.shift()
            glob(pendingGlob, null, (err, matches) => {
                this.pendingGlobMatches = matches
                this.grepFile()
            })
        } else if (this.currentFile) {
            this.grepFile()
        } else {
            this.push(null)
        }
    }

    grepFile() {
        if (!this.currentGlob) {
            this.currentGlob = this.pendingGlobMatches.pop()
        }
        if (this.currentFiles.length === 0) {
            fs.readdir()
        }
        if (!this.currentFile) {
            if (this.pendingGlobMatches.length === 0) {
                return this.push(null)
            }
            this.currentFile = this.pendingGlobMatches.pop()
            this.currentFileStream = readline.createInterface({
                input: fs.createReadStream(this.currentFile),
            })
        }
        this.currentFileStream.on('line', line => {
            console.log(line)
        })
    }
}

function grep(options) {
    return new Grep(options)
}

module.exports = grep
module.exports.Grep = Grep
