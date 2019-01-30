# To Do List

This contains a list of *possible* to-do items of varying importance.

- Limited read size capabilities.
  - Since we return a stream, we can allow the client to request a limited result set.
- Ability to process recursive directory or glob results as a stream so grepping large contents of files is more efficient.
- Ability to display statistics
  - Files searched, lines searched, size searched.
- Ability to run a function or execute a program for each result found.
- Grep from stdin when no file is specified.
- Make binary content matching identical to original `grep/egrep`?