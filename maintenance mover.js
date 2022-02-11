// 2022-02-04 — BG move files maintenance tool
const os = require('os');
const fs = require('fs');
var _7z = require('7zip-min'); // npm install 7zip-min

var preferences = FetchPreferences();
var preferencesString = JSON.stringify(preferences);

var backupFolder = preferences.backup_source_folder;
var SSDPath = preferences.backup_destination_folder;

var backupFolder = '/Users/bradleygallavin/Desktop/Unmoved_Backups';
var SSDPath = '/Users/bradleygallavin/Desktop/Moved_Backups';

var folderNames = GetFolderContents(backupFolder); 
SteralizeFolders(folderNames); // Trim out all of the shite folders

folderNames.forEach(folder => {
    var backupFiles = GetFolderContents(backupFolder + '/' + folder);
    if( backupFiles == undefined) return; //Step out if there are no backup files in the folder.

    var zipFiles = GetZips(backupFiles);
    if( zipFiles == undefined ) return; // Step out of this itteration if we don't have any zip files in the folder.

    if( preferencesString.indexOf('folder') === -1 )
        preferences.customer_backup_folders[preferences.customer_backup_folders.length] = {'customer_name' : folder, 'backup_folder_path' : backupFolder + '/' + folder, 'copy_and_extract' : true};
        SetPreferences(preferences);


    var fileToCopy = zipFiles[zipFiles.length-1];
    if( fileToCopy == undefined) 
        return; // Step out of this itteration if we don't have any files to copy.

    MoveFile(
        backupFolder + '/' + folder + '/' + fileToCopy, 
        SSDPath + '/' + folder + ' - ' + fileToCopy,
        folder
    );
});



function GetFolderContents(parentPath){
    try{
        var folders = fs.readdirSync(parentPath); // Find out all of the folder names that reside in 'Customers (FileMaker)'.
        return folders;
    }catch(e){
        console.error(e);
        throw new Error('Could not locate backups in ' + parentPath);
    }
}

function SteralizeFolders(folderNames){
    var omitFolders = ['.', '(', '1', '2']; // Don't take any notice of folders that have these characters in their names.

    for (let i = 0; i < folderNames.length; i+= 0) {
        const folder = folderNames[i];
        var ommitted = false;
    
        omitFolders.forEach(illegalChar => {
            if(folder.includes(illegalChar)){
                folderNames.splice(i, 1);
                ommitted = true;
                return;
            }
        });
        if(!ommitted) i++;
    }
}

function GetZips(FileNames){
    var filesToReturn = [];
    
    FileNames.forEach(file => {
        if(file.includes('.zip')) filesToReturn.push(file);
    });
    return filesToReturn;
}

function MoveFile(source, destination, unzippedName){
    fs.copyFile(source, destination, function(err, stats){
        if(err){
            console.error('Error: ' + err);
            throw new Error('Failed to copy ' + source + ' to ' + destination);
        }else{
            console.log('Moved ' + source);
            var resultingFile = SSDPath + '/' + unzippedName;
            UnzipFile(source, resultingFile);
            DeleteFile(destination);
        }
    });
}

function UnzipFile(source, destination){
    console.log('About to unzip ' + source );
    _7z.unpack(source, destination, err => {
        if(err) 
            console.error('Failed to unzip ' + source + '\nError: ' + err);
        else 
            console.log('Unzipped ' + source ); 
    });
}

function DeleteFile(filePath){
    try{
        fs.rmSync(filePath);
        console.log('Deleted zip file ' + filePath);
    }catch(e){
        throw new Error('Failed to delete ' + filePath + '\nError: ' + e);
    }
    
}

function FetchPreferences(){
    try{
        var preferencePath = process.cwd() + '/preferences.json';
        var preferenceData = fs.readFileSync(preferencePath); // Read in the preferences from the user
        var preferenceString = preferenceData.toString(); 

        var preferences = JSON.parse(preferenceString);
        return preferences;
    }catch(e){
        throw new Error('Failed to read preferences.json @ ' + preferencePath);
    }
}

function SetPreferences(json){
    var stringJSON = JSON.stringify(json);
    fs.writeFile('preferences.json', stringJSON, (err) => {
        if (err) throw err;
        console.log("Preferences saved");
    });
}