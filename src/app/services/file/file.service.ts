import { Injectable } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { Http, ResponseContentType } from '@angular/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FileService {

    constructor(private http: Http) { }

    downloadFile(): Observable<any> {
      return this.http.get(`${environment.apiUrl}/employees/download`, { responseType: ResponseContentType.Blob });
    }

}