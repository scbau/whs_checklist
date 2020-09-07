import { Component, OnInit, ViewChild } from '@angular/core';
import * as moment from 'moment';

import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { VisitService } from '../../services/visit/visit.service'

export interface LastVisitData {
  account: string;
  lastVisitInDays: number;
  lastVisit: string;
  position: number;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './not.visited.component.html',
  styleUrls: ['./not.visited.component.css']
})
export class NotVisitedComponent implements OnInit {

  loading = false;

  displayedColumns: string[] = ['position', 'account', 'lastVisit', 'lastVisitInDays'];
  dataSource = new MatTableDataSource<LastVisitData>();
  dataSource3 = new MatTableDataSource<LastVisitData>(); 
  dataSource2 = new MatTableDataSource<LastVisitData>();

  @ViewChild('paginator1') paginator1: MatPaginator;
  @ViewChild('paginator2') paginator2: MatPaginator;
  @ViewChild('paginator3') paginator3: MatPaginator;

  @ViewChild(MatSort, { static: true }) sort: MatSort;

  constructor(private visitService: VisitService) { }

  updateData(data1, data2, data3) {
    this.dataSource = new MatTableDataSource<LastVisitData>(data1);
    this.dataSource2 = new MatTableDataSource<LastVisitData>(data2);
    this.dataSource3 = new MatTableDataSource<LastVisitData>(data3); 

    this.dataSource.paginator = this.paginator1;
    this.dataSource2.paginator = this.paginator2;
    this.dataSource3.paginator = this.paginator3;

    this.loading = false;
  }

  ngOnInit(): void {
    this.loading = true;
    // this.dataSource.paginator = this.paginator;
    this.dataSource.paginator = this.paginator1;
    this.dataSource2.paginator = this.paginator2;
    this.dataSource3.paginator = this.paginator3;

    this.visitService.fetchLastVisited()
        .subscribe((data: any) => {
          console.log(data);
          var accounts = data.data;

          var today = moment().toDate();
          var weekOld = moment().subtract(7, 'days').toDate();
          var fortnightOld = moment().subtract(14, 'days').toDate();
          var monthOld = moment().subtract(30, 'days').toDate();

          var data1 = [], data2 = [], data3 = [];

          accounts.forEach(item => {
            var date = new Date(item.lastVisited);
            if (date <= monthOld) {
              var diffInDays = moment().diff(moment(date), 'days');
              data3.push({
                position: data3.length + 1,
                account: item.accountCode + ' ' + item.accountName,
                lastVisit: moment(date).format('DD-MM-YYYY'),
                lastVisitInDays: diffInDays
              });
            }
            else if (date <= fortnightOld && date > monthOld) {
              var diffInDays = moment().diff(moment(date), 'days');
              data2.push({
                position: data2.length + 1,
                account: item.accountCode + ' ' + item.accountName,
                lastVisit: moment(date).format('DD-MM-YYYY'),
                lastVisitInDays: diffInDays
              });
            }
            else if (date <= weekOld && date > fortnightOld) {
              var diffInDays = moment().diff(moment(date), 'days');
              data1.push({
                position: data1.length + 1,
                account: item.accountCode + ' ' + item.accountName,
                lastVisit: moment(date).format('DD-MM-YYYY'),
                lastVisitInDays: diffInDays
              });
            }
          });

          this.updateData(data1, data2, data3);
          /*this.dataSource = new MatTableDataSource<PeriodicElement>(data1);
          this.dataSource.paginator = this.paginator;*/
          /*this.dataSource2 = data2;
          this.dataSource3 = data3;*/
        });
  }
}
