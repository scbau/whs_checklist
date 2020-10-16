import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import * as moment from 'moment';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { Router, NavigationEnd } from '@angular/router';

import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ErrorStateMatcher } from '@angular/material/core';

import { FormationService } from '../../services/checklist/formation.service';
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

export interface FormationData {
  checklist: string;
  equipmentLocation: string;
  lineNumber: string;
  mon: string;
  tue: string;
  wed: string;
  thu: string;
  fri: string;
  details: [object];
}

export interface PeriodData {
  displayValue: string;
}

const LAST_YEARS = 2;

const DAILY = (function() {
  var options = [];

  var startDate = new Date(Date.now());
  startDate.setHours(0, 0, 0, 0);
  var first = startDate.getDate() - startDate.getDay() + 1
  var last = first + 4;
  var monday = new Date(startDate.setDate(first));

  var friday = new Date(startDate.valueOf());
  friday.setDate(friday.getDate() + 4);
  friday.setHours(23, 59, 59, 999);
  
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

  options.push({
    value: startMoment.toISOString(),
    end: endMoment.toISOString(),
    displayValue: "Last week (" + startMoment.format("DD/MM/YYYY") + " to " + endMoment.format("DD/MM/YYYY") + ")",
    dateView: startMoment.format("DD/MM/YYYY") + " to " + endMoment.format("DD/MM/YYYY")
  });

  startDate = new Date(Date.now());
  startDate.setHours(0, 0, 0, 0);
  startDate.setDate(startDate.getDate() - 14);
  var endDate = new Date(startDate);
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
        console.log(currentWeek);
      }
      options.push(item);
    }
  }

  // console.log(options);

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
    displayValue: 'Acid Filler',
    periodOptions: WEEKLY,
    dateUnit: 1
  },
  {
    value: 'monthly',
    displayValue: 'Monthly',
    periodOptions: MONTHLY,
    dateUnit: 30
  },
]


@Component({
  selector: 'app-dashboard',
  templateUrl: './summary.component.html',
  styleUrls: ['./formation.component.css']
})
export class SummaryComponent implements OnInit, AfterViewInit, OnDestroy {

  dateView = "";

  range = new FormGroup({
    start: new FormControl(new Date()),
    end: new FormControl(new Date())
  });

  navigationSubscription;

  currentUserRole = 'all';
  currentUserState = 'all';

  // expectedCheckCount = 0;
  isLoading = false;

  options = new FormControl('valid', [
    Validators.required,
  ]);
  optionsDaily = new FormControl('valid', [
    Validators.required,
  ]);
  matcher = new MyErrorStateMatcher();
  matcherDaily = new MyErrorStateMatcher();

  displayedColumns: string[] = ['weekNumber', 'equipmentLocation', 'lineNumber', 'mon', 'tue', 'wed', 'thu', 'fri', 'details'];
  displayedOptionColumns: string[] = ['period', 'close'];
  dataSource = new MatTableDataSource<FormationData>([]);

  @ViewChild('paginator') paginator: MatPaginator;
  @ViewChild('paginator2') paginator2: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  public selectedOption = [CHECKLIST_OPTIONS[0].periodOptions[0]];
  selectedOptionDaily = DAILY[0];
  // selectedOptionDaily = currentWeek;
  optionSource = new MatTableDataSource<PeriodData>(this.selectedOption);
  // optionSource = new MatTableDataSource<PeriodData>([]);
  // public selectedPeriod = CHECKLIST_OPTIONS[0].periodOptions[0];
  // public selectedState = '';
  public selectedChecklist = CHECKLIST_OPTIONS[0];

  // data array
  currentElementData = [];

  // filter options array 
  periods = CHECKLIST_OPTIONS[0].periodOptions;
  checklists = CHECKLIST_OPTIONS;

  // paginator size options
  pageSizeOptions = [10, 20, 40, 100];

  // constructor(private checklistService: ChecklistService, private ui: UiService) { }
  constructor(private formationService: FormationService, private authService: AuthenticationService, private router: Router) {
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
        // this.selectedState = this.currentUserState;
      }
      else if (currentUser.role == 'entityAdmin') {
        this.currentUserRole = 'entity';
        this.currentUserState = currentUser.state;
        // TODO: find a way to limit selection to states of entity (see master excel sheet for list of states per entity)
      }
    }
    this.fetchData();
    this.dateView = this.getDateView();
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
        // this.selectedState = this.currentUserState;
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
      this.dataSource = new MatTableDataSource<FormationData>(this.currentElementData);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
      this.pageSizeOptions[3] = this.currentElementData.length;
    }
    else {
      console.log(`States filter: ${data.value}`);
      var tempArray = this.currentElementData.filter(item => item.state == data.value)
      this.dataSource = new MatTableDataSource<FormationData>(tempArray);
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
      tempArray.push(currentWeek);
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
    // this.expectedCheckCount = dataList[0].expectedCheckCount;
    var tempArray = [];
    tempArray = this.currentElementData;
    /*if (!this.selectedState) {
      tempArray = this.currentElementData;
    }
    else {
      // this.dataSource = new MatTableDataSource
      tempArray = this.currentElementData.filter(item => item.state == this.selectedState)
    }*/
    this.dataSource = new MatTableDataSource<FormationData>(tempArray);
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
    console.log("!!!!!")
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
    else {
      params.push({ from: this.selectedOptionDaily.value, to: this.selectedOptionDaily.end });
    }

    console.log(this.selectedChecklist.value);

    this.formationService.fetchData('acidFiller', params)
      .subscribe((data: any) => {
        console.log(data);

        var result = [];

        var arrayData = data.data;
        console.log(arrayData);
        for (var key in arrayData) {
          console.log(key);
          var item = arrayData[key];

          var row = {};
          row["weekNumber"] = key;

          for (var equipmentLocation in item) {
            var row1 = { ...row };
            console.log(equipmentLocation);
            var line = item[equipmentLocation];
            row1["equipmentLocation"] = equipmentLocation;

            for (var lineNumber in line) {
              var row2 = { ...row1 };
              console.log(lineNumber);
              row2["lineNumber"] = lineNumber;
              row2["mon"] = this.identifyDayCheck(line[lineNumber][1]);
              row2["tue"] = this.identifyDayCheck(line[lineNumber][2]);
              row2["wed"] = this.identifyDayCheck(line[lineNumber][3]);
              row2["thu"] = this.identifyDayCheck(line[lineNumber][4]);
              row2["fri"] = this.identifyDayCheck(line[lineNumber][5]);
              row2["details"] = line[lineNumber];
              result.push(row2);
            }
          }
        }

        this.updateDataSource(result);
      });
  }

  public identifyDayCheck(entry) {
    if (Object.keys(entry).length == 0) {
      // empty
      return "";
    }
    else {
      if (entry.failCount == 0) {
        // all pass
        return "pass";
      }
      else {
        // failed
        return "fail";
      }
    }
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


  generateData(entry) {
    console.log(entry);

    var doc = new jsPDF('portrait', 'pt', 'a4');

    // autoTable(doc, { head: [[`${this.selectedChecklist.displayValue} VSR Pre-start Checklist`]] });

    var vsr = [];
    // vsr.push(["Checklist:", `${this.selectedChecklist.displayValue} VSR Pre-start Checklist`]);
    vsr.push(["Date Generated:", `${(new Date()).toLocaleString("en-AU")}`]);
    vsr.push(["SLOC:", entry.vehicle]);
    vsr.push(["Dates:", this.dateView]);
    vsr.push(["Expected Check Count:", entry.expectedCheckCount]);
    vsr.push(["Times Checked: ", entry.timesChecked]);

    autoTable(doc, { head: [[`${this.selectedChecklist.displayValue} VSR Pre-start Checklist`, '']], body: vsr });

    var criticalItems = [];
    var checklist = [];
    var extras = [];

    for (var item of entry.data) {
      // var details = [];
      // details.push(["Date:", item.date]);

      if (item.criticalInstances.length > 0) {
        criticalItems.push(item.criticalInstances);
      }


      var date = new Date(item.date);

      var col = [[`Checklist (${date.toLocaleDateString("en-AU")})`, "Pass / Fail / N/A", "Action Needed"]]
      var rows = [];

      for (var i = 0; i < item.answers.length; i++) {
        var temp = [item.questionDetails[i], item.answers[i], item.comments[i]];
        rows.push(temp);
      }

      checklist.push({
        head: col,
        body: rows,
        didDrawPage: (data) => {
          console.log(data);
        }
      });

      /*autoTable(doc, {
        head: col,
        body: rows,
        didDrawPage: (data) => {
          // console.log(data);
        }
      });*/

      var extra = [];
      var otherComment = ""

      if (item.otherComment) {
        otherComment = item.otherComment;
      }
      extra.push(["Odometer Reading:", item.odometerReading])
      extra.push(["Other Comments:", otherComment])
      extra.push(["Driver:", item.employee])

      /*autoTable(doc, {
        margin: { bottom: 10 },
        head: [],
        body: extra
      });*/

      extras.push({
        margin: { bottom: 10 },
        head: [],
        body: extra
      });
    }

    if (criticalItems.length > 0) {
      autoTable(doc, {
        head: [["Date", "Items"]],
        body: criticalItems
      });
    }

    for (var i = 0; i < checklist.length; i++) {
      autoTable(doc, checklist[i]);
      autoTable(doc, extras[i]);
      if (i < checklist.length-1) doc.addPage();
    }

    /*for (var check of extras) {
      autoTable
    }*/

    doc.save(`(VSR-${this.selectedChecklist.displayValue[0]}) ${entry.vehicle} (${this.dateView})`);
  }
}
