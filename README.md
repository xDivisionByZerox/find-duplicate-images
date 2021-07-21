# find-duplicate-files
A little script to find duplicate files by content in a given directory.

# How to use
> ❗ Make sure to have at least node version 14 installed on your local machine.

Clone the repo.
```
  git clone https://github.com/xDivisionByZerox/find-duplicate-files.git
```

Change the `pathToCheck` property in the `config` variable in [src/find-duplicate-files.ts](src/find-duplicate-files.ts) (line 8) to the absolute directory path you want to check for duplicate files.

> ⚠ This is planed to be exported to a cli param or config file in the future. Heads up.

Run the script via the predefined npm start script from the project directory.
```
  npm run start
```

The script will output some additional information the comand line. So keep an eye on it.