import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';

import { environment } from '../../../environments/environment';

@Injectable()
export class ChecklistService {

  constructor(private http: HttpClient) {}

  fetchData(checklist, table, params): Observable<Object> {
    /*var fromDate = params.from;
    var toDate = params.to;*/
    var fromDate = [], toDate = [];
    for (var item of params) {
      fromDate.push(item.from);
      toDate.push(item.to);
    }

    return this.fetchCompliance(checklist, table, fromDate, toDate);
  }

  // !!!TODO: handlers
  fetchCompliance(checklist: string, table: string, fromDate: string[], toDate: string[]): Observable<Object> {
    console.log(fromDate);
    console.log(toDate);
    let params = new HttpParams()
    fromDate.forEach(from => {
      params = params.append('from[]', from);
    });
    toDate.forEach(to => {
      params = params.append('to[]', to);
    });
      /*.set("from", fromDate)
      .set("to", toDate);*/
    console.log(params.toString());
    return this.http.get(`${environment.apiUrl}/api/${checklist}/${table}/compute`, { params: params })
  }
}
