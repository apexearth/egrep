#!/usr/bin/env node

const pkg = require('../package.json')
const program = require('commander')
const egrep = require('./egrep')

program
    .name('node-egrep')
    .version(pkg.version)
    .arguments('<pattern> <file...>')
    .option('-r, --recursive', 'Walk through directories recursively.')
    .option('-R, --recursive', 'Walk through directories recursively.')
    .option('-g, --glob', 'Treat file args as globs.')
    .option('-i, --ignore-case', 'Perform case insensitive matching.')
    .option('-f, --file <file>',
        'Read one or more newline separated patterns from file. ' +
        'Empty pattern lines match every input line.'
    )
    .action((pattern, file) => {
        program.objectMode = false
        program.pattern = pattern
        program.files = file
    })
    .parse(process.argv)

if (!program.files) {
    program.files = []
}

if (typeof program.file === 'string') {
    program.files.push(program.file)
}

if (!program.pattern) {
    console.error('error: missing required argument `pattern`')
    program.outputHelp()
    process.exit(1)
}

if (program.files.length === 0) {
    console.error('error: missing required argument `file`')
    program.outputHelp()
    process.exit(1)
}

const stream = egrep(program)
stream.on('data', line => {
    process.stdout.write(line.toString())
})
stream.on('error', err => {
    console.log('node-egrep:', err.message)
    process.exit(1)
})
stream.on('close', () => {
    process.exit(0)
})
