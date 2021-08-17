# find-duplicate-images
A little script to find duplicate images by content in a given directory.

# How to use
> ❗ Make sure to have at least node version 14 installed on your local machine.  
You can download the latest version [here](https://nodejs.org).

Clone the repo.
```
  git clone https://github.com/xDivisionByZerox/find-duplicate-files.git
```

Install dependencies.
```
  npm install
```

To find duplicate images run the script `npm start` script from the projects root directory. Add the absolute directory path you want to check for duplicate files at the end of the command. 
```
  npm run start *absolute/directory/path/you/want/to/check*
```

The script will output some additional information on the command line. So keep an eye on it if you are interested in some extra data.

After comparing all images, the program will attempt to open the results in your machine's default browser. If this fails, it will put a link in the terminal you can copy and past to any HTML file viewer to view the results. 

In your browser, you can view a list of duplicate image groups. Each row displays the image name, image path, a preview, and a checkbox. By checking this box, the image represented in the line will be added to a delete list. At the bottom of the document, there is a "Generate delete file" button. Pressing it will generate a `JSON` file from the delete list.

> **⚠ Warning: There is no validation if you selected only one image per duplicate group. So if you picked all duplicate files, each gets added to the list!** 

The repository offers a second prebuild script to delete all files from such a `JSON file. Just run the following command in the repositories root directory:
```
  npm run delete *path/to/delete_file.json* 
```

The script will print out how many files got deleted.

## Example:
![Example gif](documentation\example.gif)
