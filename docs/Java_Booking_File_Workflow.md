# Java Booking File Workflow

The desktop flight-status window includes **Manage Booking Files**, which opens
`java-oop/src/BookingFileSwingForm.java`. From that screen, users can add
bookings, open a standard CSV file, save the current list, or choose a
destination with Save As.

The Swing screen delegates persistence to `BookingFileService`. CSV saves are
written to a temporary file and moved into place; loads validate the column
header and parse quoted commas, quotes, and embedded newlines. Invalid records
are reported and skipped, while file-level read/write errors are shown in the
window instead of being treated as a successful operation.

Run the persistence checks with assertions enabled:

```powershell
$build = Join-Path $env:TEMP "airline-java"
New-Item -ItemType Directory -Force $build | Out-Null
$sources = Get-ChildItem java-oop\src -Recurse -Filter *.java |
    Select-Object -ExpandProperty FullName
javac -d $build $sources
java -ea -cp $build service.BookingFileServiceTest
```

The integrated runner compiles all Java sources and runs these checks as part
of its Java subject validation.
