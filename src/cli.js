#!/usr/bin/env node

const pkg = require('../package.json')
const program = require('commander')
const egrep = require('./egrep')

program
    .name('node-egrep')
    .version(pkg.version)
    .arguments('[options] <pattern> <file ...>')
    .option('-r, --recursive', 'Walk through directories recursively.')
    .option('-R, --recursive', 'Walk through directories recursively.')
    .option('-g, --glob', 'Treat file args as globs.')
    .option('-i, --ignore-case', 'Perform case insensitive matching.')
    .option('-f, --file',
        'Read one or more newline separated patterns from file. ' +
        'Empty pattern lines match every input line.'
    )
    .parse(process.argv)

program.objectMode = false
program.pattern = program.args[0]
program.files = program.args.slice(1)
if (program.file) {
    program.files.push(program.file)
}
if (!program.pattern) {
    program.outputHelp()
    process.exit(2)
}

// We *should* accept input when no files are given.
// For now we don't support it.
if (program.files.length === 0) {
    program.outputHelp()
    process.exit(2)
}

const stream = egrep(program)
stream.on('data', line => {
    process.stdout.write(line.toString())
})
stream.on('error', err => {
    console.log('node-egrep:', err.message)
    process.exit(-1)
})
stream.on('close', () => {
    process.exit(0)
})
