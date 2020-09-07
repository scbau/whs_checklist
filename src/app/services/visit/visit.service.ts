import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';

import { environment } from '../../../environments/environment';

import {
  HttpRequest,
  HttpEventType,
  HttpResponse,
} from '@angular/common/http';

@Injectable()
export class VisitService {

  constructor(private http: HttpClient) {}

  fetchVisit(fromDate: string, toDate: string): Observable<Object> {
    console.log(fromDate);
    console.log(toDate);
    let params = new HttpParams()
      .set("from", fromDate)
      .set("to", toDate);
    return this.http.get(`${environment.apiUrl}/api/visits`, { params: params })
    // return this.http.get('https://visits-backend.herokuapp.com/api/visits')
  }

  fetchAchievement(fromDate: string, toDate: string): Observable<Object> {
    console.log(fromDate);
    console.log(toDate);
    let params = new HttpParams()
      .set("from", fromDate)
      .set("to", toDate);
    return this.http.get(`${environment.apiUrl}/api/visits/compute`, { params: params })
  }

  fetchLastVisited(): Observable<Object> {
    return this.http.get(`${environment.apiUrl}/api/accounts/lastVisited`);
  }

  uploadPlan(data: FormData): Observable<Object> {
    return this.http.post(`${environment.apiUrl}/api/tripplan/upload`, data);
  }

  public upload(files: Set<File>): { [key: string]: { progress: Observable<number> } } {

    // this will be the our resulting map
    const status: { [key: string]: { progress: Observable<number> } } = {};

    files.forEach(file => {
      // create a new multipart-form for every file
      const formData: FormData = new FormData();
      formData.append('file', file, file.name);

      // create a http-post request and pass the form
      // tell it to report the upload progress
      const req = new HttpRequest('POST', `${environment.apiUrl}/api/visitplan/upload`, formData, {
        reportProgress: true
      });

      // create a new progress-subject for every file
      const progress = new Subject<number>();

      // send the http-request and subscribe for progress-updates
      this.http.request(req).subscribe(event => {
        if (event.type === HttpEventType.UploadProgress) {

          // calculate the progress percentage
          const percentDone = Math.round(100 * event.loaded / event.total);

          // pass the percentage into the progress-stream
          progress.next(percentDone);
        } else if (event instanceof HttpResponse) {

          // Close the progress-stream if we get an answer form the API
          // The upload is complete
          progress.complete();
        }
      });

      // Save every progress-observable in a map of all observables
      status[file.name] = {
        progress: progress.asObservable()
      };
    });

    // return the map of progress.observables
    return status;
  }



  // *** for testing purpose, can delete after ***
  getAccounts(): Observable<Object> {
    return this.http.get(`${environment.apiUrl}/api/accounts`);
  }
}
