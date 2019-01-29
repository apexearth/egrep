# To Do List

This contains a list of *possible* to-do items of varying importance.

- Binary file detection.
  - A binary file should not have its content returned/displayed after a match.
- Limited read size capabilities.
  - Since we return a stream, we can allow the client to request a limited result set.
- Ability to process recursive directory or glob results as a stream so grepping large contents of files is more efficient.
- Ability to ignore/exclude binary files from results.
- Ability to display statistics
  - Files searched, lines searched, size searched.
- Ability to run a function or execute a program for each result found.
- Ability to add an exclusion filemask. (for use in tandem with recursive/glob matching)
