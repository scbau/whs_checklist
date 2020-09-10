import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import * as moment from 'moment';

import { Router, NavigationEnd } from '@angular/router';

import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ErrorStateMatcher } from '@angular/material/core';

import { ChecklistService } from '../../services/checklist/checklist.service';
import { AuthenticationService } from '../../services/auth/auth.service';
// import { UiService } from '../../services/overlay/ui.service'

import { FormControl, FormGroup, FormGroupDirective, NgForm, Validators } from '@angular/forms';

/** Error when invalid control is dirty, touched, or submitted. */
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
  state: string;
  vehicle: string;
  address: string;
  frequencyCompliance: number;
  expectedCheckCount: number;
}

export interface PeriodData {
  displayValue: string;
}

const LAST_YEARS = 2;

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
  var startMoment = moment(startDate);
  startMoment.add(-7, 'days');
  startMoment.add(-1 * (startDate.getDay() - 1), 'days');

  var endMoment = moment(startMoment);
  endMoment.add(4, 'days');




  // startDate.setDate(startDate.getDate() - 7);
  // first = startDate.getDate() - startDate.getDay() + 1
  // last = first + 4;
  // var mondayMoment = moment(startDate);
  // monday = new Date(startDate.setDate(first));
  // friday = new Date(startDate.setDate(last));
  // var fridayMoment = moment(startDate);

  options.push({
    value: startMoment.toISOString(),
    end: endMoment.toISOString(),
    displayValue: "Last week (" + startMoment.format("DD/MM/YYYY") + " to " + endMoment.format("DD/MM/YYYY") + ")",
    dateView: startMoment.format("DD/MM/YYYY") + " to " + endMoment.format("DD/MM/YYYY")
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
    displayValue: "Last 7 days (" + startDate.toLocaleDateString("en-AU") + " to " + endDate.toLocaleDateString("en-AU") + ")"
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

  return options;
})();

const MAINTENANCE = DAILY;

const MONTHLY = (function() {
  var startYear = new Date(Date.now()).getFullYear();

  var startDate = new Date(startYear - LAST_YEARS, 0, 1);
  startDate.setHours(0, 0, 0, 0);

  var endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 1);
  endDate.setMilliseconds(endDate.getMilliseconds() - 1);

  var options = [{
    value: startDate.toISOString(),
    end: endDate.toISOString(),
    displayValue: (startDate.getMonth() + 1) + "-" + startDate.getFullYear(),
    dateView: (startDate.getMonth() + 1) + "-" + startDate.getFullYear()
  }];

  while (options.length < (12 * (LAST_YEARS + 1))) {
    startDate.setMonth(startDate.getMonth() + 1);
    endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);
    endDate.setMilliseconds(endDate.getMilliseconds() - 1);

    options.push({
      value: startDate.toISOString(),
      end: endDate.toISOString(),
      displayValue: (startDate.getMonth() + 1) + "-" + startDate.getFullYear(),
      dateView: (startDate.getMonth() + 1) + "-" + startDate.getFullYear()
    });
  }

  console.log("MONTHLY", options);
  return options;
})();

const CHECKLIST_OPTIONS = [
  {
    value: 'daily',
    displayValue: 'Daily',
    periodOptions: DAILY,
    dateUnit: 1
  },
  {
    value: 'monthly',
    displayValue: 'Monthly',
    periodOptions: MONTHLY,
    dateUnit: 30
  },
  /*{
    value: 'maintenance',
    displayValue: 'Maintenance',
    periodOptions: MAINTENANCE,
    dateUnit: 1
  }*/
]


@Component({
  selector: 'app-dashboard',
  templateUrl: './vsr.checklist.component.html',
  styleUrls: ['./checklist.component.css']
})
export class VSRChecklistComponent implements OnInit, AfterViewInit, OnDestroy {

  range = new FormGroup({
    start: new FormControl(new Date()),
    end: new FormControl(new Date())
  });

  navigationSubscription;

  currentUserRole = 'all';
  currentUserState = 'all';

  expectedCheckCount = 0;
  isLoading = false;

  options = new FormControl('valid', [
    Validators.required,
  ]);
  optionsDaily = new FormControl('valid', [
    Validators.required,
  ]);
  matcher = new MyErrorStateMatcher();
  matcherDaily = new MyErrorStateMatcher();

  displayedColumns: string[] = ['state', 'vehicle', 'address', 'timesChecked', 'timesCompliant', 'frequencyCompliance', 'compliance', 'timesCritical'];
  displayedOptionColumns: string[] = ['period', 'close'];
  dataSource = new MatTableDataSource<ChecklistData>([]);

  @ViewChild('paginator') paginator: MatPaginator;
  @ViewChild('paginator2') paginator2: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  public selectedOption = [CHECKLIST_OPTIONS[0].periodOptions[0]];
  selectedOptionDaily = DAILY[0];
  optionSource = new MatTableDataSource<PeriodData>(this.selectedOption);
  // optionSource = new MatTableDataSource<PeriodData>([]);
  // public selectedPeriod = CHECKLIST_OPTIONS[0].periodOptions[0];
  public selectedState = '';
  public selectedChecklist = CHECKLIST_OPTIONS[0];

  // data array
  currentElementData = [];

  // filter options array 
  states = ["ACT", "NSW", "NZ", "NT", "QLD", "SA", "TAS", "VIC", "WA"];
  periods = CHECKLIST_OPTIONS[0].periodOptions;
  checklists = CHECKLIST_OPTIONS;

  // paginator size options
  pageSizeOptions = [10, 20, 40, 100];

  // constructor(private checklistService: ChecklistService, private ui: UiService) { }
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
    // this.updateDataSource(this.currentElementData);
  }

  ngOnDestroy() {
    if (this.navigationSubscription) {
      this.navigationSubscription.unsubscribe();
    }
  }

  ngAfterViewInit(): void {
    // console.log("life: AfterViewInit");
    // this.fetchData();
  }

  ngOnInit(): void {
    // console.log("life: OnInit");
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
    // this.updateDataSource(this.currentElementData);
  }

  // filter state
  filterState(data) {
    console.log(data);
    if (!data.value) {
      console.log("Clear states filter");
      this.dataSource = new MatTableDataSource<ChecklistData>(this.currentElementData);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
      this.pageSizeOptions[3] = this.currentElementData.length;
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

  // filter checklist type (daily, weekly, monthly, biannually)
  filterChecklist(data) {
    this.periods = data.value.periodOptions;
    var tempArray = [];

    if (data.value.value == "daily") { // daily checklist handler
      this.selectedOptionDaily = data.value.periodOptions[0];
    }
    else if (data.value.value == "monthly") { // monthly checklist handler
      tempArray.push(data.value.periodOptions[(LAST_YEARS * 12) + new Date().getMonth()]);
    }
    else if (data.value.value == "maintenance") { // biannually checklist handler
      this.selectedOptionDaily = data.value.periodOptions[0];
    }
    this.updateOptionSource(tempArray);
    this.fetchData();
  }

  filterOptionList(data) {
    this.optionSource = new MatTableDataSource<PeriodData>(this.selectedOption);
    // this.optionSource = new MatTableDataSource<PeriodData>([]);
    this.optionSource.paginator = this.paginator2;
  }

  private updateOptionSource(optionList) {
    this.selectedOption = optionList;
    this.optionSource = new MatTableDataSource<PeriodData>(this.selectedOption);
    // this.optionSource = new MatTableDataSource<PeriodData>([]);
    this.optionSource.paginator = this.paginator2;
  }

  private updateDataSource(dataList) {
    console.log(dataList);
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

  removeOption(data) {
    var tempArray = this.selectedOption.filter(function(value, index, arr) {
      return value.value != data.value;
    });

    this.updateOptionSource(tempArray);
  }

  // query data
  fetchData() {
    console.log("!!!!!")
    // handle what type of checklist is displayed and must update date range default value
    this.isLoading = true;
    var params = [];
    
    if (this.selectedChecklist.value == 'monthly') {
      for (var option of this.selectedOption) {
        params.push({ from: option.value, to: option.end });
      }
    }
    else {
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
    }

    console.log(this.selectedChecklist.value);

    this.checklistService.fetchData('vsr', this.selectedChecklist.value, params)
      .subscribe((data: any) => {
        console.log(data);

        var result = [];
        var states = {};

        var arrayData = data.data;
        for (var item of arrayData) {

          if (!item.enable) {
            console.log("skipping");
            continue;
          }
          
          if (!states[item.stateReg]) {
            states[item.stateReg] = 1;
          }
          else {
            states[item.stateReg]++;
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
          row["vehicle"] = item.rego;
          row["state"] = item.stateReg;
          row["address"] = item.user;

          result.push(row);
        }

        console.log(states);
        console.log(Object.keys(states));
        this.states = Object.keys(states).sort();

        this.updateDataSource(result);
      });
  }

  getDateView() {
    console.log(this.selectedOption);
    if (this.selectedChecklist.value == 'daily') {
      if (this.selectedOptionDaily.value == 'Custom') {
        var start = this.range.value.start ? this.range.value.start.toLocaleDateString() : ""
        var end = this.range.value.end ? this.range.value.end.toLocaleDateString() : ""

        return start + " - " + end;

        // return this.range.value.start +" to "+ this.range.value.end;
      }
      return this.selectedOptionDaily.dateView;
    }
    else {
      if (this.selectedOption.length > 1) {
        var items = [];
        for (var option of this.selectedOption) {
          items.push(option.dateView);
        }

        // if (item)
        return items[0] + ` (+${items.length - 1} ${items.length === 2 ? 'other' : 'others'})`;
      }
      else
        return this.selectedOption[0].dateView;
    }
  }

  isUpdateButtonDisabled() {
    if (this.selectedChecklist.value != "daily") {
      return this.options.value?.length == 0;
    }
    else {
      if (this.selectedOptionDaily.value == 'Custom') {
        return !this.range.value.start || !this.range.value.end
      }
    }
  }

  resetPeriodFilter() {

    var data = this.selectedChecklist, tempArray = [];

    if (data.value == "daily") { // daily checklist handler
      this.selectedOptionDaily = DAILY[0];
    }
    else if (data.value == "monthly") { // monthly checklist handler
      tempArray.push(data.periodOptions[(LAST_YEARS * 12) + new Date().getMonth()]);
    }
    else if (data.value == "maintenance") { // biannually checklist handler
      // tempArray.push(data.periodOptions[data.periodOptions.length - 1]);
      this.selectedOptionDaily = MAINTENANCE[0];
    }

    this.updateOptionSource(tempArray);
    this.fetchData();
  }
}
