import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { PersistenceService } from './services/persistence/persistence.service';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { Video } from './models/video';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'TrainingModule';
  networkMode = 'online';
  items: Observable<Video>;  

  constructor(
    private persistenceService: PersistenceService,
    ) {
    this.persistenceService.connectToIDB();
    let onlineDataLength;

    this.persistenceService.getAllData('videos').then((items: any) => {
      onlineDataLength = items.length;
      if (this.networkMode === 'online' && onlineDataLength === 0) {
        // this.items = this.db.collection
        console.log('a');
      }
    })
  }
}
