# egrep

[![Travis Status](https://travis-ci.org/apexearth/egrep.svg?branch=master)]((https://coveralls.io/github/apexearth/egrep?branch=master))
[![Coverage Status](https://coveralls.io/repos/github/apexearth/egrep/badge.svg?branch=master)](https://coveralls.io/github/apexearth/egrep?branch=master)
![NPM Downloads](https://img.shields.io/npm/dw/@apexearth/egrep.svg?style=flat)
[![install size](https://packagephobia.now.sh/badge?p=@apexearth/egrep)](https://packagephobia.now.sh/result?p=@apexearth/egrep)
![License](https://img.shields.io/npm/l/@apexearth/egrep.svg?style=flat)

egrep for Node.js *(Extended Global Regular Expressions Print)*

## Installation

Use with Node.js

    $ npm install @apexearth/egrep --save

Use with Command Line

    $ npm install @apexearth/egrep -g

## Node.js Usage

```javascript
let egrep = require('@apexearth/egrep')
let stream = egrep({
    pattern: /test[1-9]/,
    files: [
        'test_files/file1.txt',
        'test_files/',
    ],
    recursive: true,
})
stream.on('data', data => {
    console.log(data)
})
stream.on('error', err => {
    console.log(err)
})
stream.on('close', () => {
    console.log('closed')
})
```

Output:
```javascript
{ file: 'test_files/file1.txt', line: 'aaaaaaatest4aaaaaaa' }
```

Use with callback:

```javascript
egrep({
    pattern: /test[1-9]/,
    files: [
        'test_files/file1.txt',
        'test_files/',
    ],
    recursive: true,
    objectMode: false,
}, (err, result) => {
    if (err) console.log(err)
    console.log(result)
})
```

Output:
```
test_files/file1.txt:aaaaaaatest4aaaaaaa
```

## Options

- `files`:             The files, folders, or globs to grep.
- `pattern`:           The pattern to grep for.
- `glob`:              Treat files option as a glob.
- `recursive`:         Recursively grep through folders.
- `ignoreCase`:        Perform case insensitive matching.
- `excludes`:          Array of RegExp exclusions.
- `objectMode`:        Set `false` to receive string data.
- `fullBinaryMatches`: Set `true` to display the full binary match.
- `hideBinaryMatches`: Set `true` to hide all binary matches.

## Command Line Usage

```
Usage: node-egrep [options] <pattern> <file...>

Options:
  -V, --version      output the version number
  -r, --recursive    Walk through directories recursively.
  -R, --recursive    Walk through directories recursively.
  -g, --glob         Treat file args as globs.
  -i, --ignore-case  Perform case insensitive matching.
  -f, --file <file>  Read one or more newline separated patterns from file. Empty pattern lines match every input line.
  --exec <cmd>       Execute a command for each match with {1}=file {2}=line
  -h, --help         output usage information

```

Examples:

```
$ node-egrep 123 test_files/numbers
1234567890

$ node-egrep -r abc test_files
test_files/one/abc:abcdefg
test_files/one/two/letters:abc

$ node-egrep -g abc "test_files/**"
test_files/one/abc:abcdefg
test_files/one/two/letters:abc

```

## Compatibility

Node.js versions 8, 10, and 11.
