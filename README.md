# find-duplicate-files
A little script to find duplicate images by content in a given directory.

# How to use
> ❗ Make sure to have at least node version 14 installed on your local machine.

Clone the repo.
```
  git clone https://github.com/xDivisionByZerox/find-duplicate-files.git
```

Install dependencies.
```
  npm install
```

Run the script via the predefined npm start script from the project directory by putting the absolute directory path you want to check for duplicate files at the end of the command. 
```
  npm run start *absolute_directory_path_you_want_to_check*
```

The script will output some additional information the comand line. So keep an eye on it if you are interested in some extra data.

After comparing all files the programm will try to open the results in your maschines default browser. If this fails it will put a link in the terminal you can copy and past to any html file viewer to view the results. 