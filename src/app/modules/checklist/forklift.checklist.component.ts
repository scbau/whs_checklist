import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import * as moment from 'moment';

import { Router, NavigationEnd } from '@angular/router';

import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ErrorStateMatcher } from '@angular/material/core';

// import { VisitService } from '../../services/visit/visit.service';
import { AuthenticationService } from '../../services/auth/auth.service';
import { ChecklistService } from '../../services/checklist/checklist.service';

import { FormControl, FormGroup, FormGroupDirective, NgForm, Validators } from '@angular/forms';

export class MyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = form && form.submitted;
    return !!(control && control.invalid && (control.dirty || control.touched || isSubmitted));
  }
}

export interface ChecklistData {
  timesChecked: number;
  timesCompliant: number;
  compliance: string;
  timesCritical: number;
  location: string;
  forklift: string;
  frequencyCompliance: number;
  expectedCheckCount: number;
}

const DAILY = (function() {
  var startDate = new Date(Date.now());
  startDate.setHours(0, 0, 0, 0);
  var endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 1);
  endDate.setMilliseconds(endDate.getMilliseconds() - 1);

  var options = [{
    value: startDate.toISOString(),
    end: endDate.toISOString(),
    displayValue: "Today",
    dateView: startDate.toLocaleDateString("en-AU")
  }];

  startDate.setDate(startDate.getDate() - 1);
  endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 1);
  endDate.setMilliseconds(endDate.getMilliseconds() - 1);

  options.push({
    value: startDate.toISOString(),
    end: endDate.toISOString(),
    displayValue: "Yesterday",
    dateView: startDate.toLocaleDateString("en-AU")
  });


  startDate = new Date(Date.now());
  startDate.setHours(0, 0, 0, 0);
  var first = startDate.getDate() - startDate.getDay() + 1
  var last = first + 4;
  var monday = new Date(startDate.setDate(first));

  var friday = new Date(startDate.valueOf());
  friday.setDate(friday.getDate() + 4);
  // var friday = new Date(startDate.setDate(first + 4));

  options.push({
    value: monday.toISOString(),
    end: friday.toISOString(),
    displayValue: "This week (" + monday.toLocaleDateString("en-AU") + " to " + friday.toLocaleDateString("en-AU") + ")",
    dateView: monday.toLocaleDateString("en-AU") + " to " + friday.toLocaleDateString("en-AU")
  });

  startDate = new Date(Date.now());
  startDate.setHours(0, 0, 0, 0);
  startDate.setDate(startDate.getDate() - 7);
  first = startDate.getDate() - startDate.getDay() + 1
  last = first + 4;
  monday = new Date(startDate.setDate(first));
  friday = new Date(startDate.setDate(last));

  options.push({
    value: monday.toISOString(),
    end: friday.toISOString(),
    displayValue: "Last week (" + monday.toLocaleDateString("en-AU") + " to " + friday.toLocaleDateString("en-AU") + ")",
    dateView: monday.toLocaleDateString("en-AU") + " to " + friday.toLocaleDateString("en-AU")
  });


  /*startDate = new Date(Date.now());
  startDate.setHours(0, 0, 0, 0);
  startDate.setDate(startDate.getDate() - 7);
  endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 7);
  endDate.setMilliseconds(endDate.getMilliseconds() - 1);

  options.push({
    value: startDate.toISOString(),
    end: endDate.toISOString(),
    displayValue: "Last 7 days"
  });*/

  startDate = new Date(Date.now());
  startDate.setHours(0, 0, 0, 0);
  startDate.setDate(startDate.getDate() - 14);
  endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 14);
  endDate.setMilliseconds(endDate.getMilliseconds() - 1);

  options.push({
    value: startDate.toISOString(),
    end: endDate.toISOString(),
    displayValue: "Last 14 days (" + startDate.toLocaleDateString("en-AU") + " to " + endDate.toLocaleDateString("en-AU") + ")",
    dateView: startDate.toLocaleDateString("en-AU") + " to " + endDate.toLocaleDateString("en-AU")
  });

  startDate = new Date(Date.now());
  startDate.setHours(0, 0, 0, 0);
  startDate.setDate(startDate.getDate() - 30);
  endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 30);
  endDate.setMilliseconds(endDate.getMilliseconds() - 1);

  options.push({
    value: startDate.toISOString(),
    end: endDate.toISOString(),
    displayValue: "Last 30 days (" + startDate.toLocaleDateString("en-AU") + " to " + endDate.toLocaleDateString("en-AU") + ")",
    dateView: startDate.toLocaleDateString("en-AU") + " to " + endDate.toLocaleDateString("en-AU")
  });

  options.push({
    value: "Custom",
    end: "",
    displayValue: "Custom",
    dateView: ""
  });

  console.log(options);
  return options;
})();


@Component({
  selector: 'app-dashboard',
  templateUrl: './forklift.checklist.component.html',
  styleUrls: ['./checklist.component.css']
})
export class ForkliftChecklistComponent implements OnInit, AfterViewInit, OnDestroy {

  range = new FormGroup({
    start: new FormControl(new Date()),
    end: new FormControl(new Date())
  });

  navigationSubscription;

  currentUserRole = 'all';
  currentUserState = 'all';

  expectedCheckCount = 0;

  isLoading = false;

  optionsDaily = new FormControl('valid', [
    Validators.required,
  ]);

  selectedOptionDaily = DAILY[0];
  matcherDaily = new MyErrorStateMatcher();
  periods = DAILY;

  // displayedColumns: string[] = ['location', 'forklift', 'timesChecked', 'timesCompliant', 'compliance', 'timesCritical'];
  displayedColumns: string[] = ['state', 'forkliftName', 'branch', 'address', 'timesChecked', 'timesCompliant', 'frequencyCompliance', 'compliance', 'timesCritical'];

  dataSource = new MatTableDataSource<ChecklistData>([]);
  // dataSource2 = new MatTableDataSource<ChecklistData>(ELEMENT_DATA_VSR);

  @ViewChild('paginator') paginator: MatPaginator;
  // @ViewChild('paginator2') paginator2: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  // public selectedOption = '7';
  // public selectedOptionVSR = '7';
  // public selectedState = 'All';

  public weeks = [];

  public selectedState = '';

  currentElementData = [];
  // currentElementData = [];

  states = ["NSW", "NZ", "QLD", "SA", "VIC", "WA", "TEST"];
  pageSizeOptions = [10, 20, 40, 100];

  // constructor(private visitService: VisitService) { }
  constructor(private checklistService: ChecklistService, private authService: AuthenticationService, private router: Router) {
    this.navigationSubscription = this.router.events.subscribe((e: any) => {
      // If it is a NavigationEnd event re-initalise the component
      if (e instanceof NavigationEnd) {
        this.initialize();
      }
    });
  }

  initialize() {
    var currentUser = this.authService.currentUserValue;
    console.log(currentUser);
    if (currentUser) {
      if (currentUser.role == 'admin') {
        this.currentUserRole = 'all';
        this.currentUserState = 'all';
      }
      else if (currentUser.role == 'stateAdmin') {
        this.currentUserRole = 'state';
        this.currentUserState = currentUser.state;
        this.selectedState = this.currentUserState;
      }
      else if (currentUser.role == 'entityAdmin') {
        this.currentUserRole = 'entity';
        this.currentUserState = currentUser.state;
        // TODO: find a way to limit selection to states of entity (see master excel sheet for list of states per entity)
      }
    }
    this.fetchData();
  }

  ngOnDestroy() {
    if (this.navigationSubscription) {
      this.navigationSubscription.unsubscribe();
    }
  }

  ngAfterViewInit(): void {
    // this.fetchData();
  }

  ngOnInit(): void {
    var currentUser = this.authService.currentUserValue;
    if (currentUser) {
      if (currentUser.role == 'admin') {
        this.currentUserRole = 'all';
        this.currentUserState = 'all';
      }
      else if (currentUser.role == 'stateAdmin') {
        this.currentUserRole = 'state';
        this.currentUserState = currentUser.state;
        this.selectedState = this.currentUserState;
      }
      else if (currentUser.role == 'entityAdmin') {
        this.currentUserRole = 'entity';
        this.currentUserState = currentUser.state;
        // TODO: find a way to limit selection to states of entity (see master excel sheet for list of states per entity)
      }
    }
    // this.updateDataSource(this.currentElementData);
  }

  filterOptionList(data) {
    /*this.optionSource = new MatTableDataSource<PeriodData>(this.selectedOption);
    // this.optionSource = new MatTableDataSource<PeriodData>([]);
    this.optionSource.paginator = this.paginator2;*/
    console.log(data);
    console.log(this.selectedState);
    if (data.value.displayValue == "Today") {
      console.log(data.value);
      // this.currentElementData = ELEMENT_DATA;
      if (this.selectedState != "") {
        this.dataSource = new MatTableDataSource<ChecklistData>(this.currentElementData.filter(item => item.state == this.selectedState));
      }
      else {
        this.dataSource = new MatTableDataSource<ChecklistData>(this.currentElementData);
      }
    }
    else if (data.value.displayValue == "Last 7 days") {
      console.log(data.value);
      this.currentElementData = this.currentElementData;
      if (this.selectedState != "") {
        this.dataSource = new MatTableDataSource<ChecklistData>(this.currentElementData.filter(item => item.state == this.selectedState));
      }
      else {
        this.dataSource = new MatTableDataSource<ChecklistData>(this.currentElementData);
      }
    }
    else if (data.value.displayValue == "Last 14 days") {
      console.log(data.value);
      this.currentElementData = this.currentElementData;
      if (this.selectedState != "") {
        this.dataSource = new MatTableDataSource<ChecklistData>(this.currentElementData.filter(item => item.state == this.selectedState));
      }
      else {
        this.dataSource = new MatTableDataSource<ChecklistData>(this.currentElementData);
      }
    }
  }

  /*ngOnInit(): void {
    this.dataSource.paginator = this.paginator1;
    this.dataSource2.paginator = this.paginator2;

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
  }*/

  /*filter(data) {
    console.log(data);
    console.log(data.value == 7);
    console.log(this.selectedState);
    if (data.value == 7) {
      console.log(data.value);
      this.currentElementData = ELEMENT_DATA;
      if (this.selectedState != "All") {
        this.dataSource = new MatTableDataSource<ChecklistData>(ELEMENT_DATA.filter(item => item.location == this.selectedState));
      }
      else {
        this.dataSource = new MatTableDataSource<ChecklistData>(ELEMENT_DATA);
      }
    }
    else if (data.value == 14) {
      console.log(data.value);
      this.currentElementData = ELEMENT_DATA2;
      if (this.selectedState != "All") {
        this.dataSource = new MatTableDataSource<ChecklistData>(ELEMENT_DATA2.filter(item => item.location == this.selectedState));
      }
      else {
        this.dataSource = new MatTableDataSource<ChecklistData>(ELEMENT_DATA2);
      }
    }
    else if (data.value == 30) {
      console.log(data.value);
      this.currentElementData = ELEMENT_DATA3;
      if (this.selectedState != "All") {
        this.dataSource = new MatTableDataSource<ChecklistData>(ELEMENT_DATA3.filter(item => item.location == this.selectedState));
      }
      else {
        this.dataSource = new MatTableDataSource<ChecklistData>(ELEMENT_DATA3);
      }
    }
  }*/

  /*filterState(data) {
    console.log(data);
    if (data.value == 'NSW') {
      console.log(data.value);
      this.dataSource = new MatTableDataSource<ChecklistData>(this.currentElementData.filter(item => item.location == data.value));
    }
    else if (data.value == 'STAU') {
      console.log(data.value);
      this.dataSource = new MatTableDataSource<ChecklistData>(this.currentElementData.filter(item => item.location == data.value));
    }
    else if (data.value == 'QLD') {
      console.log(data.value);
      this.dataSource = new MatTableDataSource<ChecklistData>(this.currentElementData.filter(item => item.location == data.value));
    }
    else if (data.value == 'WA') {
      console.log(data.value);
      this.dataSource = new MatTableDataSource<ChecklistData>(this.currentElementData.filter(item => item.location == data.value));
    }
    else if (data.value == 'VIC') {
      console.log(data.value);
      this.dataSource = new MatTableDataSource<ChecklistData>(this.currentElementData.filter(item => item.location == data.value));
    }
    else {
      console.log(data.value);
      this.dataSource = new MatTableDataSource<ChecklistData>(this.currentElementData);
    }
  }*/

  filterState(data) {
    console.log(data);
    if (!data.value) {
      console.log("Clear states filter");
      this.dataSource = new MatTableDataSource<ChecklistData>(this.currentElementData);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
      this.pageSizeOptions[3] = this.currentElementData.length;
      console.log(this.currentElementData);
    }
    else {
      console.log(`States filter: ${data.value}`);
      var tempArray = this.currentElementData.filter(item => item.state == data.value)
      this.dataSource = new MatTableDataSource<ChecklistData>(tempArray);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
      this.pageSizeOptions[3] = tempArray.length;
    }
  }

  private updateDataSource(dataList) {
    this.currentElementData = dataList;
    this.expectedCheckCount = dataList[0].expectedCheckCount;
    var tempArray = [];
    if (!this.selectedState) {
      tempArray = this.currentElementData;
    }
    else {
      // this.dataSource = new MatTableDataSource
      tempArray = this.currentElementData.filter(item => item.state == this.selectedState)
    }
    this.dataSource = new MatTableDataSource<ChecklistData>(tempArray);
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.pageSizeOptions[3] = this.currentElementData.length;
    setTimeout(() => {
      this.isLoading = false;
    }, 1000);
  }

  isUpdateButtonDisabled() {
    if (this.selectedOptionDaily.value == 'Custom') {
      return !this.range.value.start || !this.range.value.end
    }
    return false;
  }

  getDateView() {
    if (this.selectedOptionDaily.value == 'Custom') {
      var start = this.range.value.start ? this.range.value.start.toLocaleDateString() : ""
      var end = this.range.value.end ? this.range.value.end.toLocaleDateString() : ""

      return start + " - " + end;

      // return this.range.value.start +" to "+ this.range.value.end;
    }
    return this.selectedOptionDaily.dateView;
  }

  fetchData() {
    console.log("!!!!!");
    // handle what type of checklist is displayed and must update date range default value
    this.isLoading = true;
    var params = [];

    if (this.selectedOptionDaily.value == 'Custom') {
      var start = new Date(this.range.value.start.toISOString());
      start.setHours(0, 0, 0, 0);
      var end = new Date(this.range.value.end.toISOString());
      end.setHours(23, 59, 59, 999);
      params.push({
        from: start.toISOString(),
        to: end.toISOString()
      });
    }
    else
      params.push({ from: this.selectedOptionDaily.value, to: this.selectedOptionDaily.end });
      // params.push({ from: this.selectedOptionDaily.value, to: this.selectedOptionDaily.end });

    // console.log(this.selectedChecklist.value);

    this.checklistService.fetchData('forklift', 'daily', params)
      .subscribe((data: any) => {
        console.log(data);

        var result = [];
        var states = {};

        var arrayData = data.data;
        for (var item of arrayData) {
          if (!states[item.state]) {
            states[item.state] = 1;
          }
          else {
            states[item.state]++;
          }

          var row = {};
          if (item.hasOwnProperty("stats")) {
            row = item.stats;
          }
          else {
            row = {
              timesChecked: 0,
              timesCompliant: 0,
              compliance: 0,
              timesCritical: 0
            }
          }

          row["expectedCheckCount"] = item.expectedCheckCount;
          row["frequencyCompliance"] = row["timesChecked"] / item.expectedCheckCount;
          row["forkliftName"] = item.forkliftName;
          row["state"] = item.state;
          row["address"] = item.address;
          row["branch"] = item.branch;

          result.push(row);
        }

        console.log(states);
        console.log(Object.keys(states));
        this.states = Object.keys(states).sort();

        this.updateDataSource(result);
      });
  }
}
