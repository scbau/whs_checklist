import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { VisitService } from '../../services/visit/visit.service'

import { forkJoin } from 'rxjs'



@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {

  slocs = new FormControl();
  slocList: string[] = ['S01', 'S03', 'S04', 'S05', 'S38', 'M21', 'M22'];

  canRemoveFile = true;
  progress
  canBeClosed = true
  primaryButtonText = 'Upload'
  showCancelButton = true
  uploading = false
  uploadSuccessful = false

  @ViewChild('file') file
  public files: Set<File> = new Set();
  uploadedFiles = [];
  isLoading = false;

  // constructor(public dialogRef: MatDialogRef<SettingsComponent>, private visitService: VisitService) { }

  constructor(private visitService: VisitService) { }

  removeItem(file) {
    this.files.delete(file);
    // console.log(this.files);
  }

  addFiles() {
    this.file.nativeElement.click();
  }

  onFilesAdded() {
    const files: { [key: string]: File } = this.file.nativeElement.files;
    for (let key in files) {
      if (!isNaN(parseInt(key))) {
        this.files.add(files[key]);
      }
    }
  }

  reinitialize() {
    this.canRemoveFile = true;
    this.progress = 0
    this.canBeClosed = true
    this.primaryButtonText = 'Upload'
    this.showCancelButton = true
    this.uploading = false
    this.uploadSuccessful = false

    this.files = new Set();
  }

  closeDialog() {

    console.log(this.slocs);
    this.canRemoveFile = false;

    // if everything was uploaded already, just close the dialog
    if (this.uploadSuccessful) {
      // return this.dialogRef.close();
      this.reinitialize();
      return;
    }

    // set the component state to "uploading"
    this.uploading = true;

    // start the upload and save the progress map
    this.progress = this.visitService.upload(this.files);

    // convert the progress map into an array
    let allProgressObservables = [];
    for (let key in this.progress) {
      allProgressObservables.push(this.progress[key].progress);
    }

    // Adjust the state variables

    // The OK-button should have the text "Finish" now
    this.primaryButtonText = 'Clear';

    // The dialog should not be closed while uploading
    this.canBeClosed = false;
    // this.dialogRef.disableClose = true;

    // Hide the cancel-button
    this.showCancelButton = false;

    // When all progress-observables are completed...
    forkJoin(allProgressObservables).subscribe(end => {
      // ... the dialog can be closed again...
      this.canBeClosed = true;
      // this.dialogRef.disableClose = false;

      // ... the upload was successful...
      this.uploadSuccessful = true;

      // ... and the component is no longer uploading
      this.uploading = false;
    });
  }

  ngOnInit(): void {
    /*this.visitService.getAccounts()
      .subscribe((response: any) => {
        console.log(response);

        var accounts = response.data;
        var test = accounts.reduce(function(result, current) {
          if (!result[current["accountCode"]]) {
            result[current["accountCode"]] = [];
          }

          result[current["accountCode"]].push(current.sloc);
          return result;
        }, {})

        console.log(test);
      });*/
  }

  fileChange(element) {
    this.uploadedFiles = element.target.files;
  }

  upload() {
    this.isLoading = true;
    let formData = new FormData();
    for (var i = 0; i < this.uploadedFiles.length; i++) {
      formData.append("uploads[]", this.uploadedFiles[i], this.uploadedFiles[i].name);
    }
    this.visitService.uploadPlan(formData)
      .subscribe((response) => {
        console.log('response received is ', response);
        this.isLoading = false;
      })
  }
}
