# find-duplicate-images
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
  npm run start *absolute/directory/path/you/want/to/check*
```

The script will output some additional information the comand line. So keep an eye on it if you are interested in some extra data.

After comparing all files the programm will try to open the results in your maschines default browser. If this fails it will put a link in the terminal you can copy and past to any html file viewer to view the results. 

In your browser you can select the checkboxes at the end of each row to add the file to an intern list. At the bottom of the document there is a "Generate delete file" button. If you press it, a `json` file with all images that you checked the checkbox with will be generated and gets downloaded.

> **⚠ Warning: There is no validation what so ever to check if you only selected one of each file group. So if you select all duplicate files, all will get added to the list!** 

The repository offers a second prebuild script to delete all files from such `json` file. To run it simply run the following command in the repositories root directory:
```
  npm run delete *path/to/delete_file.json* 
```

The script will print out how many files got deleted.