import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';

import { environment } from '../../../environments/environment';

@Injectable()
export class FormationService {

  constructor(private http: HttpClient) {}

  fetchData(table, params): Observable<Object> {
    /*var fromDate = params.from;
    var toDate = params.to;*/
    var fromDate = [], toDate = [];
    for (var item of params) {
      fromDate.push(item.from);
      toDate.push(item.to);
    }

    if (table == "summary") {
      return this.fetchSummary(fromDate, toDate);
    }
    else {
      return this.fetchDetails(table, fromDate, toDate);
    }
  }

  // /api/formation/summary
  // /api/formation/acidFiller/compute
  // /api/formation/unloader/compute
  fetchDetails(table: string, fromDate: string[], toDate: string[]): Observable<Object> {
    let params = new HttpParams()
    fromDate.forEach(from => {
      params = params.append('from[]', from);
    });
    toDate.forEach(to => {
      params = params.append('to[]', to);
    });

    console.log(params.toString());
    return this.http.get(`${environment.apiUrl}/api/formation/${table}/compute`, { params: params })
  }

  fetchSummary(fromDate: string[], toDate: string[]): Observable<Object> {
    let params = new HttpParams()
    fromDate.forEach(from => {
      params = params.append('from[]', from);
    });
    toDate.forEach(to => {
      params = params.append('to[]', to);
    });

    return this.http.get(`${environment.apiUrl}/api/formation/summary`, { params: params })
  }
}
