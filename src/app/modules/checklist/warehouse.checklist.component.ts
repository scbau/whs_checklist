import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import * as moment from 'moment';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
// import 'jspdf-autotable';


import { Router, NavigationEnd } from '@angular/router';

import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ErrorStateMatcher } from '@angular/material/core';

import { AuthenticationService } from '../../services/auth/auth.service';
import { ChecklistService } from '../../services/checklist/checklist.service';
import { ExcelService } from '../../services/checklist/excel.service';


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
  warehouse: string;
  address: string;
  frequencyCompliance: number;
  expectedCheckCount: number;
  items: [string];
  data: [object];
}

export interface PeriodData {
  period: string;
  close: string;
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
  friday.setHours(23, 59, 59, 999);
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
  first = startDate.getDate() - startDate.getDay() + 1
  last = first + 4;
  monday = new Date(startDate.setDate(first));
  friday = new Date(startDate.setDate(last));

  options.push({
    value: monday.toISOString(),
    end: friday.toISOString(),
    displayValue: "Last week (" + monday.toLocaleDateString("en-AU") + " to " + friday.toLocaleDateString("en-AU") + ")",
    dateView: monday.toLocaleDateString("en-AU") + " to " + friday.toLocaleDateString("en-AU")
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

  // console.log(options);
  return options;
})();

var currentWeek = {};

var WEEKLY = (function() {
  var options = [];
  var start = new Date(Date.now()).getFullYear();
  for (var i = LAST_YEARS; i >= 0; i--) {
    var startYear = start - i;
    var startDate = moment(new Date(startYear, 0, 1));

    if (startDate.date() == 8) {
      startDate = startDate.isoWeekday(-6);
    }

    var today = moment(new Date(startYear, 11, 31)).isoWeekday('Sunday');
    while (startDate.isBefore(today)) {
      let startDateWeek = startDate.isoWeekday('Monday').format('DD-MM-YYYY');
      let startDateISO = startDate.toISOString();
      
      let endDateWeek = startDate.isoWeekday('Sunday').format('DD-MM-YYYY');
      let endDateISO = startDate.toISOString();

      var end = new Date(endDateISO);
      end.setDate(end.getDate() + 1);
      end.setMilliseconds(end.getMilliseconds() - 1);

      startDate.add(7, 'days');
      var item = {
        value: startDateISO,
        end: end.toISOString(),
        displayValue: startDateWeek + " to " + endDateWeek,
        dateView: startDateWeek + " to " + endDateWeek
      };

      if (moment().isBetween(moment(startDateISO), moment(endDateISO), undefined, '[]')) { // 6/15 0:00:00 to 6/21   0:00:00
        currentWeek = item;
      }
      options.push(item);
    }
  }

  // console.log(options);

  return options;
})();

var MONTHLY = (function() {
  var startYear = new Date(Date.now()).getFullYear();

  var startDate = new Date(startYear - LAST_YEARS , 0, 1);
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

  while (options.length < (12 * (LAST_YEARS+1))) {
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

  // console.log("MONTHLY", options);
  return options;
})();


var ANNUAL = (function() {
  var startDate = new Date(Date.now());
  startDate.setFullYear(startDate.getFullYear() - LAST_YEARS, 0, 1);
  startDate.setHours(0, 0, 0, 0);
  var endDate = new Date(startDate);
  endDate.setFullYear(endDate.getFullYear() + 1);
  endDate.setMilliseconds(endDate.getMilliseconds() - 1);

  var options = [{ 
    value: startDate.toISOString(), 
    end: endDate.toISOString(),
    displayValue: startDate.getFullYear(),
    dateView: startDate.getFullYear()
  }];

  while (options.length < (LAST_YEARS+1)) {
    startDate.setFullYear(startDate.getFullYear() + 1);
    endDate.setFullYear(endDate.getFullYear() + 1);
    options.push({ 
      value: startDate.toISOString(),
      end: endDate.toISOString(), 
      displayValue: startDate.getFullYear(),
      dateView: startDate.getFullYear()
    });
  }

  // console.log("ANNUAL", options);

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
    value: 'weekly',
    displayValue: 'Weekly',
    periodOptions: WEEKLY,
    dateUnit: 7
  },
  {
    value: 'monthly',
    displayValue: 'Monthly',
    periodOptions: MONTHLY,
    dateUnit: 30
  },
  {
    value: 'biannually',
    displayValue: 'Biannually',
    periodOptions: ANNUAL,
    dateUnit: 1
  }
]


@Component({
  selector: 'app-dashboard',
  templateUrl: './warehouse.checklist.component.html',
  styleUrls: ['./checklist.component.css']
})
export class WarehouseChecklistComponent implements OnInit, AfterViewInit, OnDestroy, OnDestroy {

  dateView = "";

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

  displayedColumns: string[] = ['state', 'warehouse', 'address', 'timesChecked', 'timesCompliant', 'frequencyCompliance', 'compliance', 'timesCritical', 'items'];
  displayedOptionColumns: string[] = ['period', 'close'];
  dataSource = new MatTableDataSource<ChecklistData>([]);

  @ViewChild('paginator') paginator: MatPaginator;
  @ViewChild('paginator2') paginator2: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  // filter values
  public selectedOption = [CHECKLIST_OPTIONS[0].periodOptions[0]];
  selectedOptionDaily = CHECKLIST_OPTIONS[0].periodOptions[0];
  optionSource = new MatTableDataSource<PeriodData>(this.selectedOption);
  // public selectedPeriod = CHECKLIST_OPTIONS[0].periodOptions[0];
  public selectedState = '';
  public selectedChecklist = CHECKLIST_OPTIONS[0];

  // data array
  currentElementData = [];

  // filter options array 
  states = ["NSW", "NZ", "QLD", "SA", "TEST", "VIC", "WA"];
  periods = CHECKLIST_OPTIONS[0].periodOptions;
  checklists = CHECKLIST_OPTIONS;

  // paginator size options
  pageSizeOptions = [10, 20, 40, 100];

  constructor(private excelService: ExcelService, private whService: ChecklistService, private authService: AuthenticationService, private router: Router) {
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
    this.dateView = this.getDateView();
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
    else if (data.value.value == "weekly") { // weekly checklist handler
      tempArray.push(currentWeek);
    }
    else if (data.value.value == "monthly") { // monthly checklist handler
      tempArray.push(data.value.periodOptions[(LAST_YEARS * 12) + new Date().getMonth()]);
    }
    else if (data.value.value == "biannually") { // biannually checklist handler
      tempArray.push(data.value.periodOptions[data.value.periodOptions.length - 1]);
    }
    this.updateOptionSource(tempArray);
    this.fetchData();
  }

  filterOptionList(data) {
    console.log(data);

    this.optionSource = new MatTableDataSource<PeriodData>(this.selectedOption);
    this.optionSource.paginator = this.paginator2;
  }

  private updateOptionSource(optionList) {
    this.selectedOption = optionList;
    this.optionSource = new MatTableDataSource<PeriodData>(this.selectedOption);
    this.optionSource.paginator = this.paginator2;
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
    this.dateView = this.getDateView();
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

    console.log("!!!!selectedOptionDaily", this.selectedOptionDaily);

    this.isLoading = true;
    // handle what type of checklist is displayed and must update date range default value
    var params = [];
    if (this.selectedChecklist.value != 'daily') {
      for (var option of this.selectedOption) {
        params.push({ from: option.value, to: option.end });
      }
    }
    else if (this.selectedChecklist.value == 'daily') {

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

    console.log(params);

    this.whService.fetchData('warehouse', this.selectedChecklist.value, params)  
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

          // console.log(item);
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
          row["items"] = item.items;
          row["expectedCheckCount"] = item.expectedCheckCount;
          row["frequencyCompliance"] = row["timesChecked"] / item.expectedCheckCount;
          row["warehouse"] = item.site;
          row["state"] = item.state;
          row["address"] = item.address;
          row["data"] = item.data;

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
    else if (data.value == "weekly") { // weekly checklist handler
      tempArray.push(currentWeek);
    }
    else if (data.value == "monthly") { // monthly checklist handler
      tempArray.push(data.periodOptions[(LAST_YEARS * 12) + new Date().getMonth()]);
    }
    else if (data.value == "biannually") { // biannually checklist handler
      tempArray.push(data.periodOptions[data.periodOptions.length - 1]);
    }

    this.updateOptionSource(tempArray);
    this.fetchData();
  }


  generateData(entry) {
    console.log(entry);

    var doc = new jsPDF('portrait', 'pt', 'a4');

    // autoTable(doc, { head: [], body: [] })


    var warehouse = [];
    warehouse.push(["Checklist:", `${this.selectedChecklist.displayValue} Warehouse Depot Checklist`]);
    warehouse.push(["Site:", entry.warehouse]);
    warehouse.push(["Address:", entry.address]);
    warehouse.push(["Dates:", this.dateView]);
    warehouse.push(["Expected Check Count:", entry.expectedCheckCount]);
    warehouse.push(["Times Checked: ", entry.timesChecked]);

    autoTable(doc, { head: [], body: warehouse });

    for (var item of entry.data) {
      // var details = [];
      // details.push(["Date:", item.date]);

      var date = new Date(item.date);

      var col = [[`Checklist (${date.toLocaleDateString("en-AU")})`, "Pass / Fail / N/A", "Action Needed"]]
      var rows = [];

      for (var i = 0; i < item.answers.length; i++) {
        var temp = [item.questionDetails[i], item.answers[i], item.comments[i]];
        rows.push(temp);
      }

      autoTable(doc, { 
        head: col, 
        body: rows,
        didDrawPage: (data) => {
          // console.log(data);
        }
      });

      var extra = [];
      var otherComment = ""

      if (item.otherComment) {
        otherComment = item.otherComment;
      }
      extra.push(["Other Comments:", otherComment])
      extra.push(["Employee:", item.employee])
      
      autoTable(doc, {
        margin: { bottom: 10 },
        head: [],
        body: extra
      });
    }

    var shortAddress = entry.address.split(',')[0];

    doc.save(`(Whse-${this.selectedChecklist.displayValue[0]}) ${entry.warehouse}-${entry.address.split(',')[0]} (${this.dateView})`);
  }

  exportToExcel() {
    console.log(`exporting to excel file`);
    console.log(this.dataSource.data);
    var copy = JSON.parse(JSON.stringify(this.dataSource.data));
    console.log(copy);

    var convertedData = [];

    copy.sort((a, b) => {
      return b.timesChecked - a.timesChecked;
    });

    var filteredData = copy.filter((current, index, result) => {
      // console.log(current);
      delete current.data;
      return current.vehicle != "TEST";
    });

    filteredData.forEach((current) => {
      delete current.data;
      delete current.items;

      current["State"] = current.state;
      delete current.state;
      current["Warehouse"] = current.warehouse;
      delete current.warehouse;
      current["Address"] = current.address;
      delete current.address;
      current["Expected Check Count"] = current.expectedCheckCount;
      delete current.expectedCheckCount;
      current["Times Checked"] = current.timesChecked;
      delete current.timesChecked;
      current["Times Compliant"] = current.timesCompliant;
      delete current.timesCompliant;
      current["Frequency Check Compliance"] = current.frequencyCompliance;
      delete current.frequencyCompliance;
      current["Warehouse Safety Compliance"] = current.compliance;
      delete current.compliance;
      current["Times Critical"] = current.timesCritical;
      delete current.timesCritical;

      // console.log(current);
      convertedData.push(current);
    });

    this.excelService.exportAsExcelFile(convertedData, `(${this.selectedChecklist.displayValue}) Warehouse Checklist Non-Compliance`, this.dateView);
  }
}
