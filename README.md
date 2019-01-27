# egrep

egrep for Node.js *(Extended Global Regular Expressions Print)*

## Installation

    $ npm install egrep --save

## Grep Recursively

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

##### Options

- `files`: The files, folders, or globs to grep.
- `pattern`: The pattern to grep for.
- `glob`: Treat files option as a glob.
- `recursive`: Recursively grep through folders.
- `ignoreCase`: Perform case insensitive matching.
- `objectMode`: 