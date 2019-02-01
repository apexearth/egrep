# egrep

egrep for Node.js *(Extended Global Regular Expressions Print)*

## Installation

Use with Node.js

    $ npm install https://github.com/apexearth/egrep --save

Use with Command Line

    $ npm install https://github.com/apexearth/egrep -g

## Node.js Usage

```javascript
let egrep = require('egrep')
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

- `files`:      The files, folders, or globs to grep.
- `pattern`:    The pattern to grep for.
- `glob`:       Treat files option as a glob.
- `recursive`:  Recursively grep through folders.
- `ignoreCase`: Perform case insensitive matching.
- `objectMode`: Set `false` to receive string data.

## Command Line Usage

```
Usage: node-egrep [options] [options] <pattern> <fil>

Options:
  -V, --version      output the version number
  -r, --recursive    Walk through directories recursively.
  -R, --recursive    Walk through directories recursively.
  -g, --glob         Treat file args as globs.
  -i, --ignore-case  Perform case insensitive matching.
  -f, --file         Read one or more newline separated patterns from file. Empty pattern lines match every input line.
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