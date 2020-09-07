import { Component, OnInit, AfterViewInit } from '@angular/core';
import { ChartOptions, ChartType, ChartDataSets } from 'chart.js';
import * as pluginDataLabels from 'chartjs-plugin-datalabels';
import { Label } from 'ng2-charts';
import { FormControl } from '@angular/forms';

import * as moment from 'moment';

import { VisitService } from '../../services/visit/visit.service'


import { first } from 'rxjs/operators';
import { User } from '../../models/user';
import { AuthenticationService } from '../../services/auth/auth.service';
import { UserService } from '../../services/auth/user.service';

/*interface TestData {
  visitCount?: number,
  total?: number,
  accountCode?: string,
  accountName?: string
}*/

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, AfterViewInit {

  loading = false;

  users: User[];

  data;
  visits$;

  totalAchievement = 0;

  public weeks = [];
  selectedRange;

  public barChartOptions: ChartOptions = {
    maintainAspectRatio: false,
    scales: {
      xAxes: [{
        ticks: {
          max: 100,
          min: 0,
          // steps: 10,
          // stepValue: 10,
          callback: label => `${label}%`
        }
      }], yAxes: [{}]
    },
    plugins: {
      datalabels: {
        anchor: 'end',
        align: 'end',
      }
    }
  };

  public barChartOptions2: ChartOptions = {
    maintainAspectRatio: false,
    scales: {
      xAxes: [{
        ticks: {
          max: 100,
          min: 0,
          // steps: 10,
          // stepValue: 10,
          callback: label => `${label}%`
        }
      }], yAxes: [{}]
    },
    plugins: {
      datalabels: {
        anchor: 'end',
        align: 'end',
      }
    }
  };

  public selectedOption = ["20-04-2020"];
  

  public barChartLabels: Label[] = ['NSW'];
  public barChartLabels2: Label[] = [];
  public barChartType: ChartType = 'horizontalBar';
  public barChartType2: ChartType = 'horizontalBar';
  public barChartLegend = true;
  public barChartLegend2 = false;
  public barChartPlugins = [pluginDataLabels];
  public barChartPlugins2 = [pluginDataLabels];

  public barChartColors2 = ['#8ec441', '#8ec441'];

  public barChartData: ChartDataSets[] = [
    { data: [], label: 'Achievement' }
  ];

  public barChartData2: ChartDataSets[] = [];

  constructor(private visitService: VisitService, private userService: UserService) { }

  fetchVisit() {
    this.loading = true;
    this.barChartLabels2 = [];
    this.barChartData2 = [];
    this.barChartData = [
      { data: [], label: 'Achievement' }
    ];

    console.log(this.selectedRange.value);

    if (this.selectedRange.value.length > 0) {
      var dateString = this.selectedRange.value[0].split('-');

      var fromDate = moment(new Date(dateString[2], dateString[1]-1, dateString[0]));
      var toDate = moment(fromDate).add(13, 'days');

      // console.log(fromDate.format('DD-MM-YYYY'));
      console.log(fromDate.toISOString());
      console.log(toDate.toISOString());
      // console.log(toDate.format('DD-MM-YYYY'));

      this.visitService.fetchAchievement(fromDate.toISOString(), toDate.toISOString())
        .subscribe((data: any) => {
          console.log(data);

          var arrayData = data.data;

          var dataHolder = [];
          var totalAchievement = { visit: 0, plan: 0 };
          this.loading = false;

          for (var item in arrayData) {
            dataHolder.push(((arrayData[item].totalVisit / arrayData[item].totalExpected) * 100).toFixed(0));

            totalAchievement.visit += arrayData[item].totalVisit;
            totalAchievement.plan += arrayData[item].totalExpected;

            this.barChartLabels2.push(item);
          }
          
          this.totalAchievement = totalAchievement.visit / totalAchievement.plan;
          var convert = ((totalAchievement.visit / totalAchievement.plan) * 100).toFixed(0);
          this.barChartData[0].data.push(parseInt(convert));

          this.barChartData2.push({
            data: dataHolder,
            label: "Achievement",
            backgroundColor: "rgba(142,196,65,1)"
          });

        });
    }
  }

  ngOnInit(): void {

    // this.loading = true;
    this.userService.getAll().pipe(first()).subscribe(users => {
      
      this.users = users;
    });

    this.selectedRange = new FormControl();

    var startDate = moment(new Date(2020, 0, 1));

    if (startDate.date() == 8) {
      startDate = startDate.isoWeekday(-6);
    }

    var today = moment(new Date(2020, 11, 31)).isoWeekday('Sunday');
    while (startDate.isBefore(today)) {
      let startDateWeek = startDate.isoWeekday('Monday').format('DD-MM-YYYY');
      let endDateWeek = startDate.isoWeekday('Sunday').add(7, 'days').format('DD-MM-YYYY');
      startDate.add(7, 'days');
      this.weeks.push([startDateWeek, endDateWeek]);
    }

    console.log(this.weeks);
  }

  ngAfterViewInit(): void {
    this.fetchVisit();
  }

  public chartClicked({ event, active }: { event: MouseEvent, active: {}[] }): void {
    console.log(event, active);
  }

  public chartHovered({ event, active }: { event: MouseEvent, active: {}[] }): void {
    console.log(event, active);
  }

  filter(data) {
    console.log(data.value);
  }
}
