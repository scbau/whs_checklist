import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { SettingsComponent } from './settings.component';
import { VisitService } from '../../services/visit/visit.service';

@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.scss']
})
export class UploadComponent {
  constructor(public dialog: MatDialog, public visitService: VisitService) { }

  public openUploadDialog() {
    let dialogRef = this.dialog.open(SettingsComponent, { width: '50%', height: '50%' });
  }
}