import { Injectable } from '@angular/core';
import { Video } from '../../models/video';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Http, Headers } from '@angular/http';
import { PersistenceService } from '../persistence/persistence.service';

import { ServerSettingsService } from '../server-settings.service';

@Injectable({
  providedIn: 'root'
})
export class VideoService {
  private apiUrl = this.svrSettings.getApiURL();

  public videos: Video[] = [
    {
      path: '',
      downloaded: false,
      data: ''
    }
  ];

  constructor (
    private http: Http,
    private svrSettings: ServerSettingsService
    ) {}

  getVideos() {
    const url = this.apiUrl + 'videos';
    const result = this.http.get(url)
    .pipe(
      map(res => res.json())
    );
    return result;
  }

  /*constructor(private persistenceService: PersistenceService) {

  }

  getVideos(): Observable<Video[]> {
  	return this.persistenceService.getAll('videos')
  }

  toggleToDo(video: Video): Observable<void> {
  	return this.persistenceService.save('videos', {
  		...video,
  	});
  }

  addVideo(title: string): Observable<void> {
  	return this.persistenceService.save('videos', {
  		title
  	});
  }*/
}
